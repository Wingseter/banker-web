var DB = require('../lib/database');

function countByUser(user) {
    var sql = 'SELECT count(*) AS TotalCount FROM cards WHERE user=?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, [user]).then(function (res) {
            var totalCount = res.row[0].TotalCount;
            resolve(totalCount);
        });
    });
    return promise;     
}

function getByUser(user){
    var sql2 = 'SELECT * FROM cards WHERE user=?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql2, [user]).then(function (res) {
            resolve(res.row);
        }); 
    });
    return promise;
}

module.exports.countByUser = countByUser;
module.exports.getByUser = getByUser;
