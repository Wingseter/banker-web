const express = require('express');
const catchErrors = require('../lib/async-error');
const Card = require('../models/card');

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
    var password = form.password || "";
    var type = form.type || "";

    password = password.trim();
    type = type.trim();

    if (!password) {
        return 'password is required.';
    }

    if (!type) {
        return 'type is required.';
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

router.get('/:id/input', catchErrors(async (req, res, next) => {
    const account = await Account.findById(req.params.id);
    console.log(account);
  
    res.render('accounts/input', { account: account});
}));

router.get('/:id/output', catchErrors(async (req, res, next) => {
    const account = await Account.findById(req.params.id);
  
    res.render('accounts/output', { account: account});
}));

router.get('/:id/sendmoney', needAuth, catchErrors(async (req, res, next) => {
    const account = await Account.findById(req.params.id);
    res.render('accounts/sendmoney', { account: account });
}));

router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
    const account = await Account.findById(req.params.id);
    res.render('accounts/edit', { account: account });
}));

router.get('/:id', catchErrors(async (req, res, next) => {
    const account = await Account.findById(req.params.id);
    console.log(account);
  
    res.render('accounts/show', { account: account});
}));


router.put('/:id', catchErrors(async (req, res, next) => {
    const account = await Account.findById(req.params.id);

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
    var err = validateForm(req.body, {needPassword: true});
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }
    const user = req.user;
    var account = {
        type: req.body.type,
        money: 0,
        card: false,
        date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        user: user.id
    };
    await Account.save(account);
    req.flash('success', 'Successfully make account');
    res.redirect('/accounts');
}));



module.exports = router;
