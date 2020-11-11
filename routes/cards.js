const express = require('express');
const catchErrors = require('../lib/async-error');
const Card = require('../models/card');
const Account = require('../models/account')
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

    max = max.trim();
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
        return 'Max must be ';
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


router.get('/new', needAuth, (req, res, next) => {
    res.render('cards/new', { cards: {} });
});

router.get('/:id/use', catchErrors(async (req, res, next) => {
    const card = await Card.findById(req.params.id);
    res.render('cards/use', { card: card});
}));

router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
    const account = await Card.findById(req.params.id);
    res.render('accounts/edit', { account: account });
}));

router.get('/:id', catchErrors(async (req, res, next) => {
    const card = await Card.findById(req.params.id);

    res.render('cards/show', { card: card});
}));


router.put('/:id', catchErrors(async (req, res, next) => {
    const card = await Card.findById(req.params.id);

    if (!account) {
        req.flash('danger', 'Not exist account');
        return res.redirect('back');
    }
    account.title = req.body.title;
    account.content = req.body.content;
    account.tags = req.body.tags.split(" ").map(e => e.trim());

    await account.save();
    req.flash('success', 'Successfully updated');
    res.redirect('/accounts');
}));

router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
    await Account.findOneAndRemove({ _id: req.params.id });
    req.flash('success', 'Successfully deleted');
    res.redirect('/accounts');
}));

router.post('/', needAuth, catchErrors(async (req, res, next) => {
    console.log("test");
    var err = validateForm(req.body, {needPassword: true});
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }
    const user = req.user;
    var card = {
        date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        max: req.body.max,
        lastuse: new Date().toISOString().slice(0, 19).replace('T', ' '),
        type: req.body.type,
        user: user.id,
        account: req.body.account,
    };
    await Card.save(card);
    req.flash('success', 'Successfully make card');
    res.redirect('/cards');
}));


function cardForm(form, options) {
    console.log(form);
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
    var card = await Card.findById(req.params.id);
    var account = await Account.findById(card.account);
    var money = req.body.money;
    
    if (account.money < money){
        req.flash('danger', "결제거부: 잔액이 부족합니다.");
        return res.redirect('back');
    }
    await Card.useCard(card.id, money);
    req.flash('success', '결제가 완료 되었습니다');
    res.redirect('/cards');
}));




module.exports = router;
