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

function save(account){
    var sql = 'INSERT INTO accounts SET ? ';
    DB('GET', sql, account).then(function (err, results) {
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

module.exports.countByUser = countByUser;
module.exports.getByUser = getByUser;
module.exports.save = save;
module.exports.findById = findById;
module.exports.saveMoney = saveMoney;
module.exports.withdrawMoney = withdrawMoney;