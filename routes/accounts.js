const express = require('express');
const catchErrors = require('../lib/async-error');
const Account = require('../models/account');

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
router.get('/', needAuth, catchErrors(async(req, res, next) => {
    const user = req.user.id;

    const term = req.query.term;
    var accounts = await Account.getByUser(user);
    var total = await Account.countByUser(user) || 0;

    console.log(accounts);
    console.log(total);
    res.render('accounts/index', { accounts: accounts, term: term, query: req.query, total: total });
}));


router.get('/new', needAuth, (req, res, next) => {
    res.render('accounts/new', { account: {} });
});

router.get('/:id/input', catchErrors(async (req, res, next) => {
    const account = await Account.findById(req.params.id);
    console.log(account);
  
    res.render('accounts/input', { account: account});
}));

router.get('/:id/output', catchErrors(async (req, res, next) => {
    const account = await Account.findById(req.params.id);
    console.log(account);
  
    res.render('accounts/output', { account: account});
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


function validateMoney(form, options) {
    var money = form.money || "";
  
    if (!money) {
        return '돈을 입력하세요.';
    }

    if (money <= 0) {
        return '1원 이상 입력하세요';
    }

    return null;
}

router.post('/:id/input', needAuth, catchErrors(async (req, res, next) => {
    var err = validateMoney(req.body, {needPassword: true});
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }
    const input = req.body.money;
    const dest = req.params.id
    await Account.saveMoney(dest, input);
    req.flash('success', 'Successfully Save Money');
    res.redirect('/accounts');
}));


router.post('/:id/output', needAuth, catchErrors(async (req, res, next) => {
    var err = validateMoney(req.body, {needPassword: true});
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }
    
    // 출금할 돈이 더 많으면 못뺌
    const account = await Account.findById(req.params.id);
    if(account.mondy - req.body.money < 0) {
        req.flash('danger', '출금할 돈이 부족합니다.');
        return res.redirect('back');
    }
    const output = req.body.money;
    const dest = req.params.id
    await Account.withdrawMoney(dest, output);
    req.flash('success', 'Successfully withdraw Money');
    res.redirect('/accounts');
}));

module.exports = router;
