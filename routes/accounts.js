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


/* GET accounts listing. */
router.get('/', needAuth, catchErrors(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const user = req.user.id;

    const term = req.query.term;
    const accounts = await Account.getById(user);
    const total = await Account.countById(user);
    // console.log(total);
    // console.log(accounts);
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
    const user = req.user;
    var account = new Account({
        title: req.body.title,
        author: user._id,
        content: req.body.content,
        tags: req.body.tags.split(" ").map(e => e.trim()),
    });
    await account.save();
    req.flash('success', 'Successfully posted');
    res.redirect('/accounts');
}));

module.exports = router;
