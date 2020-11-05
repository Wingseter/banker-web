var conn = require('../lib/database');

function findById(id, done){
    var sql = 'SELECT * FROM users WHERE id=?';
    conn.query(sql, [id], function (err, results) {
        if (err) {
            console.log(err);
            done('There is no user.');
        } else {
            done(null, results[0]);
        }
    });
}

function findOne(id, done){
    var sql = 'SELECT * FROM users WHERE id=? ORDER BY id DESC limit 1';
    conn.query(sql, [id], function (err, results) {
        if (err) {
            console.log(err);
            done('There is no user.');
        } else {
            done(null, results[0]);
        }
    });
}

module.exports.findById = findById;
module.exports.findOne = findOne;
