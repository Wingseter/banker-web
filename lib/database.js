var mysql = require('mysql');
var conn = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'root',
    password : '4321',
    database : 'bank'
});

conn.connect(function(err) {
    if (err) throw err;
});

module.exports = conn;