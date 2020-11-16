var DB = require('../lib/database');

function countByAccount(account) {
    var sql = 'SELECT count(*) AS TotalCount FROM history WHERE account=?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, [account]).then(function (res) {
            var totalCount = res.row[0].TotalCount;
            resolve(totalCount);
        });
    });
    return promise;     
}

function findByAccount(user){
    var sql2 = 'SELECT * FROM history WHERE account=?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql2, [user]).then(function (res) {
            resolve(res.row);
        }); 
    });
    return promise;
}

function getNewId(dest, date){
    var sql2 = 'SELECT MAX(id) AS id FROM history WHERE account = ? AND DATE(date)=DATE(?)';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql2, [dest, date]).then(function (res) {
            resolve(res.row[0].id || 0);
        }); 
    });
    return promise;
}

function save(account){
    var sql = 'INSERT INTO history SET ? ';
    DB('',sql, account).then(function (res) {
        if (!res) {
            console.log("save Error occer");
        }
    });
}

module.exports.countByAccount = countByAccount;
module.exports.findByAccount = findByAccount;
module.exports.getNewId = getNewId;
module.exports.save = save;
