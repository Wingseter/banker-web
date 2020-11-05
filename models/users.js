var conn = require('../lib/database');

function findById(id, done){
    var sql = 'SELECT * FROM users WHERE id=?';
    conn.query(sql, [id], function (err, results) {
        if (err) {
            console.log(err);
        } else {
            return results[0];
        }
    });
}

function findOne(id, done){
    var sql = 'SELECT * FROM users WHERE id=? ORDER BY id DESC limit 1';
    conn.query(sql, [id], function (err, results) {
        if (err) {
            console.log(err);
        } else {
            return results[0];
        }
    });
}

function saveUser(user){
    console.log(user)
    var sql = 'INSERT INTO users SET ? ';
    conn.query(sql, user, function (err, results) {
        if (err) {
            console.log(err);
        } else {
            console.log(user);
        }
    });
}

module.exports.findById = findById;
module.exports.findOne = findOne;
module.exports.saveUser = saveUser;
