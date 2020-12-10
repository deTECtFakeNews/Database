/* const mysql = require('mysql');
const Twitter = require('twitter');

const Data = {
    Database: mysql.createConnection({
        host: "localhost", 
        user: "A01023646",
        password: process.env.MYSQLPASS,
        database: "FakeNews",
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

module.exports = Data; */


const mysql = require('mysql2');
const {Client} = require('ssh2');
const sshConnection = new Client();

// GLOBAL VARIABLES
const SSH_DATA = {
    host: '10.4.27.75',
    port: 22, 
    username: 'A01023646',
    password: 'TEC.Lalongo1606',
    tryKeyboard: true
}
const MYSQL_DATA = {
    host: '127.0.0.1', 
    user: 'DataUser',
    password: 'TEC.F4keNews',
    database: 'FakeNews',
    port: 3306,
}

// Data Object
const Data = {
    Database: undefined,
    Twitter: undefined
}


let SSHconnect = () => new Promise((resolve, reject)=>{
    // Connect
    sshConnection.connect(SSH_DATA);
    // "Type" password
    sshConnection.on('keyboard-interactive', (name, instructions, lang, propmts, finish)=>{
        finish([SSH_DATA.password]);
    });
    // When ready
    sshConnection.on('ready', ()=>{
        console.log("Server :: SSH Connection ready");
        // Forward
        sshConnection.forwardOut(SSH_DATA.host, MYSQL_DATA.port, '127.0.0.1', MYSQL_DATA.port, (err, stream) => {
            if (err) reject(err);
            resolve(stream);
        })
    })
})

let DBconnect = async () => {
    try{
        let stream = await SSHconnect();
        Data.Database = mysql.createConnection({...MYSQL_DATA, stream})
    } catch (e) {
        return e;
    }
}

DBconnect().then(()=>{
    Data.Database.connect((err)=>{
        console.log(err)
    })
})