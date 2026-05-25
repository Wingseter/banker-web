import { Router } from 'express';
import { body } from 'express-validator';
import { RowDataPacket } from 'mysql2';

import * as Accounts from '../models/accounts';
import * as History from '../models/history';
import { catchErrors } from '../lib/async-error';
import { withTransaction } from '../lib/db';
import { needAuth } from '../middlewares/auth';
import { validateForm } from '../middlewares/validate';

const router = Router();

const moneyRule = body('money')
  .exists({ checkFalsy: true }).withMessage('돈을 입력하세요.').bail()
  .toFloat()
  .isFloat({ gt: 0 }).withMessage('1원 이상 입력하세요.');

const typeRule = body('type')
  .trim()
  .notEmpty().withMessage('Type is required.');

const transferRules = [
  moneyRule,
  body('to')
    .exists({ checkFalsy: true }).withMessage('받는 계좌를 입력하세요.').bail()
    .isInt({ min: 1 }).withMessage('계좌 ID가 올바르지 않습니다.'),
];

function nowDbTimestamp(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

router.get(
  '/',
  needAuth,
  catchErrors(async (req, res) => {
    const userId = (req.user as { id: number }).id;
    const moneyTotal = await Accounts.moneyTotal(userId);
    const accounts = await Accounts.getByUser(userId);
    const total = await Accounts.countByUser(userId);
    res.render('accounts/index', { accounts, moneyTotal, total });
  }),
);

router.get('/new', needAuth, (_req, res) => {
  res.render('accounts/new', { account: {} });
});

router.get(
  '/:id/input',
  needAuth,
  catchErrors(async (req, res) => {
    const account = await Accounts.findById(req.params.id);
    if (!account) {
      req.flash('danger', 'Account does not exist.');
      return res.redirect('back');
    }
    res.render('accounts/input', { account });
  }),
);

router.get(
  '/:id/output',
  needAuth,
  catchErrors(async (req, res) => {
    const account = await Accounts.findById(req.params.id);
    if (!account) {
      req.flash('danger', 'Account does not exist.');
      return res.redirect('back');
    }
    res.render('accounts/output', { account });
  }),
);

router.get(
  '/:id/sendmoney',
  needAuth,
  catchErrors(async (req, res) => {
    const account = await Accounts.findById(req.params.id);
    if (!account) {
      req.flash('danger', 'Account does not exist.');
      return res.redirect('back');
    }
    res.render('accounts/sendmoney', { account });
  }),
);

router.get(
  '/:id/edit',
  needAuth,
  catchErrors(async (req, res) => {
    const account = await Accounts.findById(req.params.id);
    res.render('accounts/edit', { account });
  }),
);

router.get(
  '/:id',
  needAuth,
  catchErrors(async (req, res) => {
    const account = await Accounts.findWithUserById(req.params.id);
    if (!account) {
      req.flash('danger', 'Account does not exist.');
      return res.redirect('back');
    }
    const historys = await History.findByAccount(req.params.id);
    const histCount = await History.countByAccount(req.params.id);
    const view = { ...account, card: account.card === 1 ? '카드 신청' : '카드 신청 안함' };
    res.render('accounts/show', { account: view, historys, histCount });
  }),
);

router.put(
  '/:id',
  needAuth,
  validateForm([typeRule]),
  catchErrors(async (req, res) => {
    const account = await Accounts.findById(req.params.id);
    if (!account) {
      req.flash('danger', 'Account does not exist.');
      return res.redirect('back');
    }
    await Accounts.updateType(account.id, req.body.type);
    req.flash('success', 'Successfully updated');
    res.redirect('/accounts');
  }),
);

router.delete(
  '/:id',
  needAuth,
  catchErrors(async (req, res) => {
    await Accounts.deleteById(req.params.id);
    req.flash('success', 'Successfully deleted');
    res.redirect('/accounts');
  }),
);

router.post(
  '/',
  needAuth,
  validateForm([typeRule]),
  catchErrors(async (req, res) => {
    const user = req.user as { id: number };
    await Accounts.save({
      type: req.body.type,
      money: 0,
      card: 0,
      date: nowDbTimestamp(),
      user: user.id,
    });
    req.flash('success', 'Successfully made account');
    res.redirect('/accounts');
  }),
);

// ---------- money-moving endpoints ----------
// All three wrap balance change + history insert in a single DB transaction
// so a partial failure (DB error, application throw between the two writes)
// rolls back the balance.

router.post(
  '/:id/input',
  needAuth,
  validateForm([moneyRule]),
  catchErrors(async (req, res) => {
    const money = Number(req.body.money);
    const accountId = Number(req.params.id);
    const content = (req.body.content as string | undefined)?.trim() || '입금';
    const date = nowDbTimestamp();

    await withTransaction(async (conn) => {
      await conn.query('UPDATE accounts SET money = money + ? WHERE id = ?', [money, accountId]);
      const [leftRows] = await conn.query<RowDataPacket[]>(
        'SELECT money FROM accounts WHERE id = ?',
        [accountId],
      );
      const left = leftRows[0]?.money ?? '0';
      const [idRows] = await conn.query<RowDataPacket[]>(
        'SELECT COALESCE(MAX(id), 0) AS id FROM history WHERE account = ? AND DATE(date) = DATE(?)',
        [accountId, date],
      );
      const id = Number(idRows[0].id) + 1;
      await conn.query(
        `INSERT INTO history (account, date, id, type, content, money, \`left\`)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [accountId, date, id, '입금', content, money, left],
      );
    });

    req.flash('success', 'Successfully saved money');
    res.redirect('/accounts');
  }),
);

router.post(
  '/:id/output',
  needAuth,
  validateForm([moneyRule]),
  catchErrors(async (req, res) => {
    const money = Number(req.body.money);
    const accountId = Number(req.params.id);
    const content = (req.body.content as string | undefined)?.trim() || '출금';
    const date = nowDbTimestamp();

    let insufficient = false;
    await withTransaction(async (conn) => {
      // Re-check balance inside the transaction so concurrent withdrawals can't
      // double-spend. Using SELECT ... FOR UPDATE to lock the row.
      const [balRows] = await conn.query<RowDataPacket[]>(
        'SELECT money FROM accounts WHERE id = ? FOR UPDATE',
        [accountId],
      );
      const balance = Number(balRows[0]?.money ?? 0);
      if (balance < money) {
        insufficient = true;
        return;
      }
      await conn.query('UPDATE accounts SET money = money - ? WHERE id = ?', [money, accountId]);
      const left = balance - money;
      const [idRows] = await conn.query<RowDataPacket[]>(
        'SELECT COALESCE(MAX(id), 0) AS id FROM history WHERE account = ? AND DATE(date) = DATE(?)',
        [accountId, date],
      );
      const id = Number(idRows[0].id) + 1;
      await conn.query(
        `INSERT INTO history (account, date, id, type, content, money, \`left\`)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [accountId, date, id, '출금', content, -money, left],
      );
    });

    if (insufficient) {
      req.flash('danger', '출금거부: 잔액이 부족합니다.');
      return res.redirect('back');
    }

    req.flash('success', 'Successfully withdrew money');
    res.redirect('/accounts');
  }),
);

router.post(
  '/:id/sendmoney',
  needAuth,
  validateForm(transferRules),
  catchErrors(async (req, res) => {
    const money = Number(req.body.money);
    const from = Number(req.params.id);
    const to = Number(req.body.to);
    const content = (req.body.content as string | undefined)?.trim() || '계좌이체';
    const date = nowDbTimestamp();
    // Optional sentinel for the rollback test: setting ?fail=1 throws after
    // the withdraw row updates so we can prove the transaction unwinds.
    // Strictly off in production to avoid an external DoS vector. Phase 5
    // will replace this with proper jest mocks and drop the sentinel.
    const forceFail =
      req.query.fail === '1' && process.env.NODE_ENV !== 'production';

    let failure: 'insufficient' | 'no-recipient' | null = null;
    await withTransaction(async (conn) => {
      // Lock both rows in ascending id order to avoid deadlocks.
      const [first, second] = [from, to].sort((a, b) => a - b);
      const [rowsFirst] = await conn.query<RowDataPacket[]>(
        'SELECT id, money FROM accounts WHERE id = ? FOR UPDATE',
        [first],
      );
      const [rowsSecond] = await conn.query<RowDataPacket[]>(
        'SELECT id, money FROM accounts WHERE id = ? FOR UPDATE',
        [second],
      );

      const byId = new Map<number, { id: number; money: string }>();
      for (const r of [...(rowsFirst as { id: number; money: string }[]), ...(rowsSecond as { id: number; money: string }[])]) {
        byId.set(r.id, r);
      }
      const fromRow = byId.get(from);
      const toRow = byId.get(to);
      if (!toRow) {
        failure = 'no-recipient';
        return;
      }
      if (!fromRow || Number(fromRow.money) < money) {
        failure = 'insufficient';
        return;
      }

      await conn.query('UPDATE accounts SET money = money - ? WHERE id = ?', [money, from]);
      if (forceFail) {
        // Forced mid-transfer crash for the rollback test.
        throw new Error('forced-failure-for-test');
      }
      await conn.query('UPDATE accounts SET money = money + ? WHERE id = ?', [money, to]);

      const leftFrom = Number(fromRow.money) - money;
      const leftTo = Number(toRow.money) + money;

      const [idFromRows] = await conn.query<RowDataPacket[]>(
        'SELECT COALESCE(MAX(id), 0) AS id FROM history WHERE account = ? AND DATE(date) = DATE(?)',
        [from, date],
      );
      const idFrom = Number(idFromRows[0].id) + 1;
      await conn.query(
        `INSERT INTO history (account, date, id, type, content, money, \`left\`)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [from, date, idFrom, '계좌이체', content, -money, leftFrom],
      );

      const [idToRows] = await conn.query<RowDataPacket[]>(
        'SELECT COALESCE(MAX(id), 0) AS id FROM history WHERE account = ? AND DATE(date) = DATE(?)',
        [to, date],
      );
      const idTo = Number(idToRows[0].id) + 1;
      await conn.query(
        `INSERT INTO history (account, date, id, type, content, money, \`left\`)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [to, date, idTo, '계좌이체', content, money, leftTo],
      );
    });

    if (failure === 'no-recipient') {
      req.flash('danger', '상대방이 존재하지 않습니다.');
      return res.redirect('back');
    }
    if (failure === 'insufficient') {
      req.flash('danger', '출금거부: 잔액이 부족합니다.');
      return res.redirect('back');
    }

    req.flash('success', 'Successfully sent money');
    res.redirect('/accounts');
  }),
);

export default router;
