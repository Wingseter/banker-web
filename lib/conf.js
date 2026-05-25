var conf = {
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bank',
    multipleStatements: false,
};

module.exports = conf;
