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
function countCardByAccount(account) {
    var sql = 'SELECT count(*) AS cardCount FROM cards WHERE cards.account = ?;';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, account).then(function (res) {
            var cardCount = res.row[0].cardCount;
            resolve(cardCount);
        });
    });
    return promise;     
}


function getAccountById(id) {
    var sql = 'SELECT account FROM cards WHERE id = ?;';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, id).then(function (res) {
            console.log(res.row);
            resolve(res.row[0].account);
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

function findById(id){
    var sql = 'SELECT * FROM cards WHERE id=?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, [id]).then(function (res) {
            resolve(res.row[0]);
        }); 
    });
    return promise;
}

function save(card){
    var sql = 'INSERT INTO cards SET ?';
    var promise = new Promise((resolve, reject) =>{
        DB('',sql, card).then(function (res) {
            resolve(res.row);
        });
    });
    return promise
}

function useCard(id, money){
    var sql = 'update accounts set money = money-? WHERE id = (\
        SELECT account FROM cards WHERE id = ?);';
    var promise = new Promise((resolve, reject) =>{
        DB('',sql, [money, id]).then(function (res) {   
            resolve(1);
        });
    });
    return promise
}

function findUserAndCardById(id){
    var sql = 'SELECT * FROM users, cards WHERE users.id = cards.user  AND cards.id=?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, [id]).then(function (res) {
            resolve(res.row[0]);
        }); 
    });
    return promise;
}

function saveDate(id, date){
    var sql = 'update card set lastuse = ? WHERE id = ?;'
    var promise = new Promise((resolve, reject) =>{
        DB('',sql, [date, id]).then(function (res) {   
            resolve(1);
        });
    });
    return promise
}

function updateCard(card){
    var sql = 'UPDATE cards SET max = ?, type = ?, account = ?\
    , cardname = ? WHERE id = ?';
    var promise = new Promise((resolve,reject) => {
        DB('',sql, [card.max, card.type, card.account,
            card.cardname, card.id]).then(function (res) {
            resolve(res.row);
        });
    });
    return promise;
}

function findOneAndRemove(id){
    var sql = 'DELETE FROM cards WHERE id = ?';
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
module.exports.useCard = useCard;
module.exports.findUserAndCardById = findUserAndCardById;
module.exports.saveDate = saveDate;
module.exports.updateCard = updateCard;
module.exports.findOneAndRemove = findOneAndRemove;
module.exports.countCardByAccount = countCardByAccount;
module.exports.getAccountById = getAccountById;
