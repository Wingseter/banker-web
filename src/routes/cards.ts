import { Router } from 'express';
import { body } from 'express-validator';
import { RowDataPacket } from 'mysql2';

import * as Cards from '../models/cards';
import * as Accounts from '../models/accounts';
import { catchErrors } from '../lib/async-error';
import { withTransaction } from '../lib/db';
import { needAuth } from '../middlewares/auth';
import { validateForm } from '../middlewares/validate';

const router = Router();

const cardCreateRules = [
  body('max')
    .exists({ checkFalsy: true }).withMessage('Card limit is required.').bail()
    .toFloat()
    .isFloat({ gt: 0 }).withMessage('카드 한도는 1 이상이어야 합니다.'),
  body('type').trim().notEmpty().withMessage('Type is required.'),
  body('account').exists({ checkFalsy: true }).withMessage('Account is required.'),
];

const cardUseRules = [
  body('content').trim().notEmpty().withMessage('Content is required.'),
  body('money')
    .exists({ checkFalsy: true }).withMessage('Money is required.').bail()
    .toFloat()
    .isFloat({ gt: 0 }).withMessage('결제 거부: 1원 이상 써야합니다.'),
];

function nowDbTimestamp(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

router.get(
  '/',
  needAuth,
  catchErrors(async (req, res) => {
    const userId = (req.user as { id: number }).id;
    const cards = await Cards.getByUser(userId);
    const total = await Cards.countByUser(userId);
    res.render('cards/index', { cards, term: req.query.term, query: req.query, total });
  }),
);

router.get(
  '/new',
  needAuth,
  catchErrors(async (req, res) => {
    const accounts = await Accounts.getIdsByUser((req.user as { id: number }).id);
    if (accounts.length === 0) {
      req.flash('danger', 'Please make an account first.');
      return res.redirect('back');
    }
    res.render('cards/new', { cards: {}, accounts });
  }),
);

router.get(
  '/:id/use',
  needAuth,
  catchErrors(async (req, res) => {
    const card = await Cards.findById(req.params.id);
    res.render('cards/use', { card });
  }),
);

router.get(
  '/:id/edit',
  needAuth,
  catchErrors(async (req, res) => {
    const cards = await Cards.findById(req.params.id);
    const accounts = await Accounts.getIdsByUser((req.user as { id: number }).id);
    res.render('cards/edit', { cards, accounts });
  }),
);

router.get(
  '/:id',
  needAuth,
  catchErrors(async (req, res) => {
    const card = await Cards.findWithUserById(req.params.id);
    res.render('cards/show', { card });
  }),
);

router.put(
  '/:id',
  needAuth,
  catchErrors(async (req, res) => {
    const card = await Cards.findById(req.params.id);
    if (!card) {
      req.flash('danger', 'Card does not exist.');
      return res.redirect('back');
    }
    card.cardname = req.body.name ?? card.cardname;
    card.max = Number(req.body.max);
    card.type = req.body.type;
    card.account = Number(req.body.account);
    await Cards.updateCard(card);
    req.flash('success', 'Successfully updated');
    res.redirect('/cards');
  }),
);

router.delete(
  '/:id',
  needAuth,
  catchErrors(async (req, res) => {
    const accountId = await Cards.getAccountIdById(req.params.id);
    await Cards.deleteById(req.params.id);
    if (accountId !== undefined) {
      const count = await Cards.countByAccount(accountId);
      const state = await Accounts.getCardState(accountId);
      if (count < 1 && state === 1) {
        await Accounts.toggleCardState(accountId);
      }
    }
    req.flash('success', 'Successfully deleted');
    res.redirect('/cards');
  }),
);

router.post(
  '/',
  needAuth,
  validateForm(cardCreateRules),
  catchErrors(async (req, res) => {
    const name = req.body.name?.trim() || req.body.type;
    const accountId = Number(req.body.account);
    const count = await Cards.countByAccount(accountId);
    const state = await Accounts.getCardState(accountId);
    if (count === 0 && state === 0) {
      await Accounts.toggleCardState(accountId);
    }
    await Cards.save({
      date: nowDbTimestamp(),
      max: Number(req.body.max),
      lastuse: nowDbTimestamp(),
      type: req.body.type,
      user: (req.user as { id: number }).id,
      account: accountId,
      cardname: name,
    });
    req.flash('success', 'Successfully made card');
    res.redirect('/cards');
  }),
);

router.post(
  '/:id/use',
  needAuth,
  validateForm(cardUseRules),
  catchErrors(async (req, res) => {
    const money = Number(req.body.money);
    const content = req.body.content as string;
    const date = nowDbTimestamp();
    const cardId = Number(req.params.id);

    const card = await Cards.findById(cardId);
    if (!card) {
      req.flash('danger', 'Card does not exist.');
      return res.redirect('back');
    }

    let insufficient = false;
    await withTransaction(async (conn) => {
      // Lock the linked account row so we can charge it atomically.
      const [balRows] = await conn.query<RowDataPacket[]>(
        'SELECT money FROM accounts WHERE id = ? FOR UPDATE',
        [card.account],
      );
      const balance = Number(balRows[0]?.money ?? 0);
      if (balance < money) {
        insufficient = true;
        return;
      }
      await conn.query('UPDATE accounts SET money = money - ? WHERE id = ?', [money, card.account]);
      const left = balance - money;
      const [idRows] = await conn.query<RowDataPacket[]>(
        'SELECT COALESCE(MAX(id), 0) AS id FROM history WHERE account = ? AND DATE(date) = DATE(?)',
        [card.account, date],
      );
      const id = Number(idRows[0].id) + 1;
      await conn.query(
        `INSERT INTO history (account, date, id, type, content, money, \`left\`)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [card.account, date, id, '카드사용', content, -money, left],
      );
      await conn.query('UPDATE cards SET lastuse = ? WHERE id = ?', [date, cardId]);
    });

    if (insufficient) {
      req.flash('danger', '결제거부: 잔액이 부족합니다.');
      return res.redirect('back');
    }

    req.flash('success', '결제가 완료 되었습니다');
    res.redirect('/cards');
  }),
);

export default router;
