const express = require('express');
const catchErrors = require('../lib/async-error');
const Card = require('../models/card');
const Account = require('../models/account')
const AccHistory = require('../models/history')
var router = express.Router();

function needAuth(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.flash('danger', 'Please signin first.');
        res.redirect('/signin');
    }
}

function validateForm(form, options) {
    var max = form.max || "";
    var type = form.type || "";
    var account = form.account || "";

    type = type.trim();
    account = account.trim();

    if (!max) {
        return 'Card limit is required.';
    }

    if (!type) {
        return 'type is required.';
    }

    if (!type) {
        return 'type is required.';
    }

    if (max <= 0) {
        return '카드 한도는 1 이상이어야 합니다.';
    }
    return null;
}

/* GET accounts listing. */
router.get('/', needAuth, catchErrors(async(req, res, next) => {
    const user = req.user.id;
    const term = req.query.term;

    var cards = await Card.getByUser(user);
    var total = await Card.countByUser(user) || 0;

    res.render('cards/index', { cards: cards, term: term, query: req.query, total: total });
}));


router.get('/new', needAuth, async (req, res, next) => {
    const accounts = await Account.getIdByUser(req.user.id);
    if(accounts.length == 0){
        req.flash('danger', 'Please make account first');
        return res.redirect('back');
    }
    res.render('cards/new', { cards: {}, accounts: accounts});
});

router.get('/:id/use',needAuth, catchErrors(async (req, res, next) => {
    const card = await Card.findById(req.params.id);
    res.render('cards/use', { card: card});
}));

router.get('/:id/edit',needAuth, needAuth, catchErrors(async (req, res, next) => {
    const cards = await Card.findById(req.params.id);
    const accounts = await Account.getIdByUser(req.user.id);
    res.render('cards/edit', { cards: cards, accounts: accounts });
}));

router.get('/:id',needAuth, catchErrors(async (req, res, next) => {
    const card = await Card.findUserAndCardById(req.params.id);

    res.render('cards/show', { card: card});
}));


router.put('/:id',needAuth, catchErrors(async (req, res, next) => {
    const card = await Card.findById(req.params.id);
    if (!card) {
        req.flash('danger', 'Not exist card');
        return res.redirect('back');
    }
    card.cardname = req.body.name;
    card.max = req.body.max;
    card.type = req.body.type;
    card.account = req.body.account; 

    await Card.updateCard(card);
    req.flash('success', 'Successfully updated');
    res.redirect('/cards');
}));

router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
    var accountId = await Card.getAccountById(req.params.id);
    await Card.findOneAndRemove(req.params.id);
    var count = await Card.countCardByAccount(accountId);
    var state = await Account.getCardState(accountId);
    if(count < 1 && state == 1){
        await Account.changeCardState(accountId);
    }
    req.flash('success', 'Successfully deleted');
    res.redirect('/cards');
}));

router.post('/', needAuth, catchErrors(async (req, res, next) => {
    var err = validateForm(req.body, {needPassword: true});
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }
    var name;
    if(!req.body.name){
        name = req.body.type;
    }
    else{
        name = req.body.name;
    }
    var card = {
        date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        max: req.body.max,
        lastuse: new Date().toISOString().slice(0, 19).replace('T', ' '),
        type: req.body.type,
        user: req.user.id,
        account: req.body.account,
        cardname: name,
    };
    
    var count = await Card.countCardByAccount(req.body.account);
    var state = await Account.getCardState(req.body.account);
    console.log(count);
    console.log(state);
    if(count == 0 && state == 0){
        await Account.changeCardState(req.body.account);
    }
    await Card.save(card);
    req.flash('success', 'Successfully make card');
    res.redirect('/cards');
}));


function cardForm(form, options) {
    var content = form.content || "";
    var money = form.money;

    content = content.trim();

    if (!content) {
        return 'content is required.';
    }

    if (!money) {
        return 'money is required.';
    }

    if (money <= 0) {
        return '결제 거부: 1원 이상 써야합니다.';
    }
    return null;
}


router.post('/:id/use', needAuth, catchErrors(async (req, res, next) => {
    var err = cardForm(req.body, {needPassword: true});
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }
    
    var money = req.body.money;
    var available = await Account.possibleCheckCard(req.params.id, money)
    if (available.available == 0){
        req.flash('danger', "결제거부: 잔액이 부족합니다.");
        return res.redirect('back');
    }

    var card = await Card.findById(req.params.id);
    if (!card) {
        req.flash('danger', 'Not exist card');
        return res.redirect('back');
    }
    await Card.useCard(card.id, money);

    const dest = card.account;
    const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    var id = await AccHistory.getNewId(dest, date);
    const left = await Account.getMoneyById(card.account);
    var history = {
        account: dest,
        date: date,
        id: id + 1,
        type: '카드사용',
        content: req.body.content,
        money: -1 * money,
        left: left,
    };

    await Card.saveDate(date, card.id);
    await AccHistory.save(history);
    req.flash('success', '결제가 완료 되었습니다');
    res.redirect('/cards');
}));




module.exports = router;
