var DB = require('../lib/database');

function countByUser(user) {
    var sql = 'SELECT count(*) AS TotalCount FROM accounts WHERE user=?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, [user]).then(function (res) {
            var totalCount = res.row[0].TotalCount;
            resolve(totalCount);
        });
    });
    return promise;     
}

function getByUser(user){
    var sql2 = 'SELECT * FROM accounts WHERE user=?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql2, [user]).then(function (res) {
            resolve(res.row);
        }); 
    });
    return promise;
}

function getIdByUser(user){
    var sql2 = 'SELECT id FROM accounts WHERE user=?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql2, [user]).then(function (res) {
            resolve(res.row);
        }); 
    });
    return promise;
}



function getMoneyById(id){
    var sql2 = 'SELECT money FROM accounts WHERE id=?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql2, [id]).then(function (res) {
            resolve(res.row[0].money);
        }); 
    });
    return promise;
}

function save(account){
    var sql = 'INSERT INTO accounts SET ? ';
    DB('',sql, account).then(function (err, results) {
        if (err) {
            console.log(err);
        } else {
            // nothing
        }
    });
}

function findById(id){
    var sql = 'SELECT * FROM accounts WHERE id=?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, [id]).then(function (res) {
            resolve(res.row[0]);
        }); 
    });
    return promise;
}

function findAccountUserById(id){
    var sql2 = 'SELECT accounts.id AS id, accounts.money AS money, accounts.card AS card, accounts.type AS type,\
    accounts.date AS date, users.name AS name, users.phone AS phone, users.id AS userid, users.email AS email \
    FROM users, accounts WHERE users.id = accounts.user AND accounts.id = ?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql2, [id]).then(function (res) {
            resolve(res.row[0]);
        }); 
    });
    return promise;
}
function saveMoney(id, money){
    var sql = 'update accounts set money = money +  ? WHERE id=?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, [money, id]).then(function (res) {
            resolve(res.row[0]);
        }); 
    });
    return promise;
}

function withdrawMoney(id, money){
    var sql = 'update accounts set money = money -  ? WHERE id=?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, [money, id]).then(function (res) {
            resolve(res.row[0]);
        }); 
    });
    return promise;
}


function sendMoney(from, to, money){
    var sql = 'update accounts set money = money -  ? WHERE id =?;update accounts set money = money +  ? WHERE id=?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, [money, from, money, to]).then(function (res) {
            resolve(res.row[0]);
        }); 
    });
    return promise;
}


function possibleCheckCard(cardId, money){
    var sql = 'SELECT accounts.money - ? > 0 AS available FROM accounts, cards WHERE cards.account = accounts.id AND cards.id = ?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, [money, cardId]).then(function (res) {
            resolve(res.row[0]);
        }); 
    });
    return promise;
}

function possibleCheck(id, money){
    var sql = 'SELECT accounts.money - ? > 0 AS available FROM accounts WHERE accounts.id = ?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, [money, id]).then(function (res) {
            resolve(res.row[0]);
        }); 
    });
    return promise;
}

function moneyTotal(user){
    var sql = 'SELECT sum(money) AS sum FROM accounts WHERE user = ?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, user).then(function (res) {
            resolve(res.row[0].sum);
        }); 
    });
    return promise;
}

function changeCardState(id){
    var sql = 'update accounts set card = IF(card = 1, 0, 1) WHERE id=?';
    var promise = new Promise((resolve,reject) => {
        DB('', sql, id).then(function (res) {
            resolve(res.row);
        }); 
    });
    return promise;
}

function getCardState(id){
    var sql = 'SELECT card FROM accounts WHERE id = ?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, id).then(function (res) {
            resolve(res.row[0].card);
        }); 
    });
    return promise;
}

function updateAccount(account){
    var sql = 'UPDATE accounts SET type = ? WHERE accounts.id = ?';
    var promise = new Promise((resolve,reject) => {
        DB('',sql, [account.type, account.id]).then(function (res) {
            resolve(res.row);
        });
    });
    return promise;
}

function findOneAndRemove(id){
    var sql = 'DELETE FROM accounts WHERE accounts.id = ?';
    var promise = new Promise((resolve,reject) => {
        DB('',sql, id).then(function (res) {
            resolve(res.row);
        });
    });
    return promise;     
}


module.exports.countByUser = countByUser;
module.exports.getByUser = getByUser;
module.exports.save = save;
module.exports.findById = findById;
module.exports.saveMoney = saveMoney;
module.exports.withdrawMoney = withdrawMoney;
module.exports.sendMoney = sendMoney;
module.exports.getIdByUser = getIdByUser;
module.exports.possibleCheckCard = possibleCheckCard;
module.exports.getMoneyById = getMoneyById;
module.exports.possibleCheck = possibleCheck;
module.exports.moneyTotal = moneyTotal;
module.exports.changeCardState = changeCardState;
module.exports.getCardState = getCardState;
module.exports.findAccountUserById = findAccountUserById;
module.exports.findOneAndRemove = findOneAndRemove;
module.exports.updateAccount = updateAccount;
