var conn = require('../lib/database');

function countById(user) {
    var sql = 'SELECT count(*) AS TotalCount FROM accounts WHERE user = ?';

    conn.query(sql, [user], function (err, results) {
        if (err) {
            console.log(err);
        } else {
            var totalCount = results[0].TotalCount;
            return totalCount;
        }
    });
}

function getById(user){
    var sql2 = 'SELECT * FROM accounts WHERE user = ?';
    conn.query(sql2, [user], function (err, results) {
        if (err) {
            console.log(err);
        } else {
            return results[0];
        }
    });
}


module.exports.countById = countById;
module.exports.getById = getById;