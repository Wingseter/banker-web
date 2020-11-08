var conn = require('../lib/database');

function countById(user) {
    var sql = 'SELECT count(*) AS TotalCount FROM accounts WHERE user=?';

    conn.query(sql, [user], function (err, results) {
        if (err) {
            console.log(err);
        } else {
            var totalCount = results[0].TotalCount;
            return totalCount;
        }
    });
}

const getById = async(user) =>{
    var sql2 = 'SELECT * FROM accounts WHERE user=?';
    var results = await conn.query(sql2, [user], (err) => {
        if (err) {
            console.log(err);
        }
    });

    return results[0];
}

function save(account){
    var sql = 'INSERT INTO accounts SET ? ';
    conn.query(sql, account, function (err, results) {
        if (err) {
            console.log(err);
        } else {
            // nothing
        }
    });
}

module.exports.countById = countById;
module.exports.getById = getById;
module.exports.save = save;