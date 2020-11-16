var DB = require('../lib/database');

function getAllUser(){
    var sql = 'SELECT * FROM users';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, []).then(function (res) {
            resolve(res.row);
        });
    });
    return promise;     
}

function findById(id){
    var sql = 'SELECT * FROM users WHERE id=?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, [id]).then(function (res) {
            resolve(res.row[0]);
        });
    });
    return promise;     
}

function findOne(email, done){
    var sql = 'SELECT * FROM users WHERE email=? ORDER BY id DESC limit 1';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, [email]).then(function (res) {
            resolve(res.row[0]);
        });
    });
    return promise;     
}

function findLogin(email, password){
    var sql = 'SELECT * FROM users WHERE email = ? AND password=?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, [email, password]).then(function (res) {
            resolve(res.row[0]);
        });
    });
    return promise;     
}
function findOneAndRemove(id, done){
    var sql = 'DELETE FROM users WHERE id = ?';
    var promise = new Promise((resolve,reject) => {
        DB('',sql, id).then(function (res) {
            resolve(res.row);
        });
    });
    return promise;     
}

function saveUser(user){
    var sql = 'INSERT INTO users SET ? ';
    var promise = new Promise((resolve,reject) => {
        DB('',sql, user).then(function (res) {
            resolve(res.row);
        });
    });
    return promise;
}

function updateUser(user){
    var sql = 'UPDATE users SET email = ?, name = ?, birth = ?\
    , phone = ?, password = ? WHERE id = ?';
    var promise = new Promise((resolve,reject) => {
        DB('',sql, [user.email, user.name, user.birth,
             user.phone, user.password, user.id]).then(function (res) {
            resolve(res.row);
        });
    });
    return promise;
}

module.exports.findById = findById;
module.exports.findOne = findOne;
module.exports.saveUser = saveUser;
module.exports.getAllUser = getAllUser;
module.exports.findOneAndRemove = findOneAndRemove;
module.exports.updateUser = updateUser;
module.exports.findLogin = findLogin;
