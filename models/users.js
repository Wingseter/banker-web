class User{
    findById(conn){
        var sql = 'SELECT * FROM users WHERE authId=?';
        conn.query(sql, [id], function (err, results) {
            if (err) {
                console.log(err);
                done('There is no user.');
            } else {
                done(null, results[0]);
            }
        });
    }
}

var user = new User;

module.exports = user;
