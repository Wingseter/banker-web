const express = require('express');
const catchErrors = require('../lib/async-error');
const Account = require('../models/account');

const router = express.Router();

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

    if (!form.password && options.needPassword) {
        return 'Password is required.';
    }

    if (form.password !== form.password_confirmation) {
        return 'Passsword do not match.';
    }

    if (form.password.length < 6) {
        return 'Password must be at least 6 characters.';
    }

    return null;
}

/* GET accounts listing. */
router.get('/', needAuth, catchErrors(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const user = req.user.id;

    const term = req.query.term;
    var accounts = await Account.getById(user);
    var total = await Account.countById(user) || 0;

    console.log(accounts);
    console.log(total);
    res.render('accounts/index', { accounts: accounts, term: term, query: req.query, total: total });
}));


router.get('/new', needAuth, (req, res, next) => {
    res.render('accounts/new', { account: {} });
});

router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
    const account = await Account.findById(req.params.id);
    res.render('accounts/edit', { account: account });
}));

router.get('/:id', catchErrors(async (req, res, next) => {
    const account = await Account.findById(req.params.id).populate('author');
    const answers = await Answer.find({ account: account.id }).populate('author');
    account.numReads++;    // TODO: 동일한 사람이 본 경우에 Read가 증가하지 않도록???

    await account.save();
    res.render('accounts/show', { account: account, answers: answers });
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
