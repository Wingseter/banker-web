const e = require('express');
const express = require('express');
const catchErrors = require('../lib/async-error');
const Account = require('../models/account');
const AccHistory = require('../models/history');

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
    var type = form.type || "";
    type = type.trim();
    if (!type) {
        return 'type is required.';
    }
    return null;
}

/* GET accounts listing. */
router.get('/', needAuth, catchErrors(async(req, res, next) => {
    const user = req.user.id;
    const moneytotal = await Account.moneyTotal(user);
    const accounts = await Account.getByUser(user);
    const total = await Account.countByUser(user) || 0;
    res.render('accounts/index', { accounts: accounts, moneyTotal: moneytotal, total: total });
}));


router.get('/new', needAuth, (req, res, next) => {
    res.render('accounts/new', { account: {} });
});

router.get('/:id/input',needAuth, catchErrors(async (req, res, next) => {
    const account = await Account.findById(req.params.id);    
  
    res.render('accounts/input', { account: account});
}));

router.get('/:id/output',needAuth, catchErrors(async (req, res, next) => {
    const account = await Account.findById(req.params.id);
  
    res.render('accounts/output', { account: account});
}));

router.get('/:id/sendmoney',needAuth, needAuth, catchErrors(async (req, res, next) => {
    const account = await Account.findById(req.params.id);
    res.render('accounts/sendmoney', { account: account });
}));

router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
    const account = await Account.findById(req.params.id);
    res.render('accounts/edit', { account: account });
}));

router.get('/:id',needAuth, catchErrors(async (req, res, next) => {
    const account = await Account.findAccountUserById(req.params.id);
    const historys = await AccHistory.findByAccount(req.params.id);
    const histCount = await AccHistory.countByAccount(req.params.id) || 0;

    if (account.card == 1){
        account.card = "카드 신청";
    }
    else{
        account.card = "카드 신청 안함";
    }
    console.log(account);
    res.render('accounts/show', { account: account, historys: historys, histCount});
}));


router.put('/:id', needAuth,catchErrors(async (req, res, next) => {
    var err = validateForm(req.body, {needPassword: false});
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }
    const account = await Account.findById(req.params.id);

    if (!account) {
        req.flash('danger', 'Not exist account');
        return res.redirect('back');
    }
    account.type = req.body.type;
    await Account.updateAccount(account);
    req.flash('success', 'Successfully updated');
    res.redirect('/accounts');
}));

router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
    await Account.findOneAndRemove(req.params.id);
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
    const money = req.body.money;
    const dest = req.params.id;
    
    await Account.saveMoney(dest, money);

    const date = new Date().toISOString().slice(0, 19).replace('T', ' ')
    var id = await AccHistory.getNewId(dest, date);

    const left = await Account.getMoneyById(req.params.id);
    var content = req.body.content;
    if(!content){
        content = "입금";
    }
    else {
        content = req.body.content;
    }
    var history = {
        account: dest,
        date: date,
        id: id + 1,
        type: '입금',
        content: content,
        money: money,
        left: left,
    };

    await AccHistory.save(history);
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
    const money = req.body.money;
    const available = await Account.possibleCheck(req.params.id, money);
    if (available.available == 0){
        req.flash('danger', "출금거부: 잔액이 부족합니다.");
        return res.redirect('back');
    }
    const dest = req.params.id;
    await Account.withdrawMoney(dest, money);

    const date = new Date().toISOString().slice(0, 19).replace('T', ' ')
    var id = await AccHistory.getNewId(dest, date);
    const left = await Account.getMoneyById(req.params.id);

    var content = req.body.content;
    if(!content){
        content = "출금";
    }
    else {
        content = req.body.content;
    }
    var history = {
        account: dest,
        date: date,
        id: id + 1,
        type: '출금',
        content: content,
        money: -1 * money,
        left: left,
    };

    await AccHistory.save(history);
    req.flash('success', 'Successfully withdraw Money');
    res.redirect('/accounts');
}));


router.post('/:id/sendmoney', needAuth, catchErrors(async (req, res, next) => {
    var err = validateMoney(req.body, {needPassword: true});
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }

    // 송금할 돈이 더 많으면 못뺌
    const money = req.body.money;
    const available = await Account.possibleCheck(req.params.id, money);
    if (available.available == 0){
        req.flash('danger', "출금거부: 잔액이 부족합니다.");
        return res.redirect('back');
    }

    const other = await Account.findById(req.body.to);
    if (other.length == 0){
        req.flash('danger', "상대방이 존재하지 않습니다.");
        return res.redirect('back');
    }
    
    const from = req.params.id;
    const to = req.body.to;
    await Account.sendMoney(from, to, money);

    const date = new Date().toISOString().slice(0, 19).replace('T', ' ')
    var idFrom = await AccHistory.getNewId(from, date);
    var idTo = await AccHistory.getNewId(to, date);

    const leftFrom = await Account.getMoneyById(from);
    const leftTo = await Account.getMoneyById(to);

    var content = req.body.content;
    if(!content){
        contentFrom = "계좌이채";
    }
    else {
        content = req.body.content;
    }

    var historyFrom = {
        account: from,
        date: date,
        id: idFrom + 1,
        type: '계좌이체',
        content: content,
        money: -1 * money,
        left: leftFrom ,
    };
    var historyTo = {
        account: to,
        date: date,
        id: idTo + 1,
        type: '계좌이체',
        content: content,
        money:  money,
        left: leftTo,
    };

    await AccHistory.save(historyTo);
    await AccHistory.save(historyFrom);
    req.flash('success', 'Successfully send Money');
    res.redirect('/accounts');
}));

module.exports = router;
