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

function findById(id){
    var sql = 'SELECT * FROM cards WHERE id=?';
    var promise = new Promise((resolve,reject) => {
        DB('GET', sql, [id]).then(function (res) {
            resolve(res.row[0]);
        }); 
    });
    return promise;
}

function save(account){
    var sql = 'INSERT INTO cards SET ?';
    var promise = new Promise((resolve, reject) =>{
        DB('',sql, account).then(function (res) {
            if (!res) {
                console.log("error");
            }
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

module.exports.countByUser = countByUser;
module.exports.getByUser = getByUser;
module.exports.save = save;
module.exports.findById = findById;
module.exports.useCard = useCard;
