import { Router } from 'express';
import * as Cards from '../models/cards';
import * as Accounts from '../models/accounts';
import * as History from '../models/history';
import { catchErrors } from '../lib/async-error';
import { needAuth } from '../middlewares/auth';

const router = Router();

interface CardForm {
  max?: string | number;
  type?: string;
  account?: string | number;
  name?: string;
}

function validateCardForm(form: CardForm): string | null {
  const type = (form.type ?? '').trim();
  if (!form.max) return 'Card limit is required.';
  if (!type) return 'Type is required.';
  if (Number(form.max) <= 0) return '카드 한도는 1 이상이어야 합니다.';
  return null;
}

interface CardUseForm {
  content?: string;
  money?: string | number;
}

function validateCardUse(form: CardUseForm): string | null {
  const content = (form.content ?? '').trim();
  if (!content) return 'Content is required.';
  if (!form.money) return 'Money is required.';
  if (Number(form.money) <= 0) return '결제 거부: 1원 이상 써야합니다.';
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
  catchErrors(async (req, res) => {
    const err = validateCardForm(req.body);
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }
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
  catchErrors(async (req, res) => {
    const err = validateCardUse(req.body);
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }
    const money = Number(req.body.money);
    if (!(await Accounts.hasEnoughFundsForCard(req.params.id, money))) {
      req.flash('danger', '결제거부: 잔액이 부족합니다.');
      return res.redirect('back');
    }
    const card = await Cards.findById(req.params.id);
    if (!card) {
      req.flash('danger', 'Card does not exist.');
      return res.redirect('back');
    }
    await Cards.useCard(card.id, money);

    const date = nowDbTimestamp();
    const id = await History.getNextDailyId(card.account, date);
    const left = (await Accounts.getMoneyById(card.account)) ?? '0';

    await Cards.saveDate(date, card.id);
    await History.save({
      account: card.account,
      date,
      id,
      type: '카드사용',
      content: req.body.content,
      money: -money,
      left,
    });

    req.flash('success', '결제가 완료 되었습니다');
    res.redirect('/cards');
  }),
);

export default router;
