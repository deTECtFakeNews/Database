const mysql = require('mysql');
const Twitter = require('twitter');

const Data = {
    Database: mysql.createConnection({
        host: "edvilme-mysql.mysql.database.azure.com", 
        user: "edvilme@edvilme-mysql",
        password: "DEV.Lalongo1606",
        database: "tec_fake_news",
        supportBigNumbers: true,
        ssl: {rejectUnauthorized: false}, 
    }),
    Twitter: new Twitter({
        consumer_key: 'yV0a5aPMXLcW3aKMSvxE9jjzu',
        consumer_secret: 'CH7t2e1hEX0WY48xVP9bKq5kvriwSf5lo9NEov6j50uJRB9wC2',
        access_token_key: '57733058-dMO5On1f6s1OfCPUSSSgSOScTlDmJbzGFaqgl6VbH',
        access_token_secret: '3PGA7ukcygjWy5s4aiilMVi0nhGuAJH1oQjgRTXIOeLXk'
    })
};

module.exports = Data;