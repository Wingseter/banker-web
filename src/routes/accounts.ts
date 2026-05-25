import { Router } from 'express';
import * as Accounts from '../models/accounts';
import * as History from '../models/history';
import { catchErrors } from '../lib/async-error';
import { needAuth } from '../middlewares/auth';

const router = Router();

interface AccountForm {
  type?: string;
}

function validateAccountForm(form: AccountForm): string | null {
  const type = (form.type ?? '').trim();
  if (!type) return 'Type is required.';
  return null;
}

interface MoneyForm {
  money?: string | number;
  content?: string;
}

function validateMoney(form: MoneyForm): string | null {
  const money = Number(form.money);
  if (!form.money || Number.isNaN(money)) return '돈을 입력하세요.';
  if (money <= 0) return '1원 이상 입력하세요.';
  return null;
}

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
  catchErrors(async (req, res) => {
    const err = validateAccountForm(req.body);
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }
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
  catchErrors(async (req, res) => {
    const err = validateAccountForm(req.body);
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }
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

router.post(
  '/:id/input',
  needAuth,
  catchErrors(async (req, res) => {
    const err = validateMoney(req.body);
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }
    const money = Number(req.body.money);
    const accountId = Number(req.params.id);

    await Accounts.deposit(accountId, money);

    const date = nowDbTimestamp();
    const id = await History.getNextDailyId(accountId, date);
    const left = (await Accounts.getMoneyById(accountId)) ?? '0';
    const content = (req.body.content as string)?.trim() || '입금';

    await History.save({
      account: accountId,
      date,
      id,
      type: '입금',
      content,
      money,
      left,
    });
    req.flash('success', 'Successfully saved money');
    res.redirect('/accounts');
  }),
);

router.post(
  '/:id/output',
  needAuth,
  catchErrors(async (req, res) => {
    const err = validateMoney(req.body);
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }
    const money = Number(req.body.money);
    const accountId = Number(req.params.id);

    if (!(await Accounts.hasEnoughFunds(accountId, money))) {
      req.flash('danger', '출금거부: 잔액이 부족합니다.');
      return res.redirect('back');
    }

    await Accounts.withdraw(accountId, money);

    const date = nowDbTimestamp();
    const id = await History.getNextDailyId(accountId, date);
    const left = (await Accounts.getMoneyById(accountId)) ?? '0';
    const content = (req.body.content as string)?.trim() || '출금';

    await History.save({
      account: accountId,
      date,
      id,
      type: '출금',
      content,
      money: -money,
      left,
    });
    req.flash('success', 'Successfully withdrew money');
    res.redirect('/accounts');
  }),
);

router.post(
  '/:id/sendmoney',
  needAuth,
  catchErrors(async (req, res) => {
    const err = validateMoney(req.body);
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }

    const money = Number(req.body.money);
    const from = Number(req.params.id);
    const to = Number(req.body.to);

    if (!(await Accounts.hasEnoughFunds(from, money))) {
      req.flash('danger', '출금거부: 잔액이 부족합니다.');
      return res.redirect('back');
    }

    const other = await Accounts.findById(to);
    if (!other) {
      req.flash('danger', '상대방이 존재하지 않습니다.');
      return res.redirect('back');
    }

    await Accounts.transfer(from, to, money);

    const date = nowDbTimestamp();
    const idFrom = await History.getNextDailyId(from, date);
    const idTo = await History.getNextDailyId(to, date);
    const leftFrom = (await Accounts.getMoneyById(from)) ?? '0';
    const leftTo = (await Accounts.getMoneyById(to)) ?? '0';
    const content = (req.body.content as string)?.trim() || '계좌이체';

    await History.save({
      account: from,
      date,
      id: idFrom,
      type: '계좌이체',
      content,
      money: -money,
      left: leftFrom,
    });
    await History.save({
      account: to,
      date,
      id: idTo,
      type: '계좌이체',
      content,
      money,
      left: leftTo,
    });

    req.flash('success', 'Successfully sent money');
    res.redirect('/accounts');
  }),
);

export default router;
