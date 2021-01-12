const mysql = require('mysql2');
const {Client} = require('ssh2');
const sshConnection = new Client();
const Twitter = require('twitter');


const SSH_DATA = {
    host: '10.4.27.75',
    port: 22, 
    username: 'A01023646',
    password: 'TEC.Lalongo1606',
    tryKeyboard: true
}
const MYSQL_DATA = {
    host: '10.4.27.75',
    user: 'DataUser',
    password: 'TEC.F4keNews',
    database: 'FakeNews',
    port: 3306,
}
const TWITTER_DATA = {
    consumer_key: 'yV0a5aPMXLcW3aKMSvxE9jjzu',
    consumer_secret: 'CH7t2e1hEX0WY48xVP9bKq5kvriwSf5lo9NEov6j50uJRB9wC2',
    access_token_key: '57733058-dMO5On1f6s1OfCPUSSSgSOScTlDmJbzGFaqgl6VbH',
    access_token_secret: '3PGA7ukcygjWy5s4aiilMVi0nhGuAJH1oQjgRTXIOeLXk'
}

/**
 * Data object for interfacing with sources
 * @typedef {Object} Data
 * @property {mysql.Connection} Database Database Object
 * @property {Twitter} Twitter Twitter Object
 * @property {function} SSHDBconnect Connect to DB over SSH
 */
/**
 * @type {Data}
 */
const Data = {
    Database: null,
    Twitter: new Twitter(TWITTER_DATA),
    SSHDBconnect: async()=>{}
}

let SSHstream = () => new Promise((resolve, reject)=>{
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
        sshConnection.forwardOut(SSH_DATA.host, MYSQL_DATA.port, MYSQL_DATA.host, MYSQL_DATA.port, (err, stream) => {
            if (err) reject(err);
            resolve(stream);
        })
    })
})

let SSHDBconnect = async () => {
    try{
        Data.Database = mysql.createConnection({...MYSQL_DATA, stream: await SSHstream()})
    } catch (e) {
        return e;
    }
}

Data.SSHDBconnect = SSHDBconnect;

module.exports = Data;