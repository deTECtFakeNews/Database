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
/**
 * @type {mysql.ConnectionOptions}
 */
 const MYSQL_DATA = {
    host: '10.4.27.75',
    user: 'DataUser',
    password: 'TEC.F4keNews',
    database: 'FakeNews',
    port: 3306,
    supportBigNumbers: true,
    bigNumberStrings: true,
    multipleStatements: true
}
const TWITTER_DATA = {
    consumer_key: 'yV0a5aPMXLcW3aKMSvxE9jjzu',
    consumer_secret: 'CH7t2e1hEX0WY48xVP9bKq5kvriwSf5lo9NEov6j50uJRB9wC2',
    access_token_key: '57733058-dMO5On1f6s1OfCPUSSSgSOScTlDmJbzGFaqgl6VbH',
    access_token_secret: '3PGA7ukcygjWy5s4aiilMVi0nhGuAJH1oQjgRTXIOeLXk'
} 

const Data = {
    /**@type {mysql.Pool} */
    DatabasePool: null, 
    /**@type {mysql.Connection} */
    Database: null, 
    /**@type {Twitter} */
    Twitter: new Twitter(TWITTER_DATA),
    /**@type {Promise<import('ssh2').ClientChannel>} */
    SSHDBConnect: null
}

let SSHstream = ()=>new Promise((resolve, reject)=>{
    // Connect
    sshConnection.connect(SSH_DATA);
    // Type Password
    sshConnection.on('keyboard-interactive', 
    (name, instructions, lang, prompts, finish)=>{finish( [SSH_DATA.password] )});
    // When ready
    sshConnection.on('ready', ()=>{
        console.log("Server :: SSH Connection ready");
        // Forward connection
        sshConnection.forwardOut(
            SSH_DATA.host, 
            MYSQL_DATA.port, 
            MYSQL_DATA.host, 
            MYSQL_DATA.port, 
            (err, stream) => { if(err) reject(err); resolve(stream); }
        )
    })
})

let SSHDBConnect = async ()=>{
    Data.DatabasePool = mysql.createPool({
        ...MYSQL_DATA,
        stream: await SSHstream()
    })
    Data.DatabasePool.getConnection((err, connection)=>{
        if(err){
            console.log("Error connecting to database");
            console.dir(err);
            if(typeof connection !== 'undefined') connection.release();
        } else {
            console.log("Server :: DB Connection ready")
        }
        Data.Database = connection;
    })
}

SSHDBConnect()