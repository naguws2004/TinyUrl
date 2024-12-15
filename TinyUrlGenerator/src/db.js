const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost', 
    port: 3306, 
    user: 'nagesh',
    password: 'Qwerty1234!',
    database: 'tinyurls'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

module.exports = connection;