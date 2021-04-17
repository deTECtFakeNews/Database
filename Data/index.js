const mysql = require('mysql2');
const {Client} = require('ssh2');
const Twitter = require('twitter');

const SSH_DATA = {
    host: '10.4.27.75',
    port: 22, 
    username: 'A01023646',
    password: 'TEC.Lalongo1606',
    tryKeyboard: true
}
/**
 * @type {mysql.PoolOptions}
 */
 const MYSQL_DATA = {
    host: '10.4.27.75',
    user: 'DataUser',
    password: 'TEC.F4keNews',
    database: 'FakeNews',
    port: 3306,
    supportBigNumbers: true,
    bigNumberStrings: true,
    multipleStatements: true,
    connectionLimit: 100
}
const TWITTER_DATA = {
    consumer_key: 'sHL0MJor5Avq0MEhI1F92k84R',
    consumer_secret: 'W5EQssAKUKwaDYHcWcJx3EhIweEezSLMNx3uFy9DAgZQnOzcDi',
    access_token_key: '780387937108299776-Ls0o5Nw468RrGTu5SjnJYT8NIdJ2bRM',
    access_token_secret: 'OSu5PSjMOGohifRhgSZizm9ZR3m2Wngd6coh6oyVGYF0U'
} 

/* const TWITTER_DATA = { 
    consumer_key: 'aVLHBb6eAQNcICDOiiKNTKT0F',
    consumer_secret: 'wNbQe0r3ARCNw1Vv1fLVxJ71OPxIrffNT1vm2BT0UeuzOIWXzw',
    access_token_key: '780387937108299776-sV7W0qip4zMXKRlY5EU6DDScFBH3wkP',
    access_token_secret: 'BmC4AJGRMJaTNj8nidvGH1nnWlUlMe62ykl130ilsKNsF'
} */

const Data = {
    /**@type {mysql.PoolCluster} */
    DatabasePoolCluster: mysql.createPoolCluster({canRetry: false}), 
    /**@type {mysql.PoolConnection} */
    Database: null, 
    /**@type {Twitter} */
    Twitter: new Twitter(TWITTER_DATA),
    /**@type {Promise<import('ssh2').ClientChannel>} */
    SSHDBconnect: null,

    DatabaseGetConnection: null, 
    DatabaseCreateConnection: null
}

let SSHstream = ()=>new Promise((resolve, reject)=>{
    let sshConnection = new Client();
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
    sshConnection.on('close', (e)=>{
        console.log(e)
    })
})

Data.DatabaseGetConnection = (name) => new Promise((resolve, reject)=>{
    Data.DatabasePoolCluster.getConnection(name, (err, connection)=>{
        if(err) {
            connection?.release();
            reject(err);
        } else {
            console.log("Server :: DB Connection ready", connection.connectionId)
            connection.connect()
            resolve(connection);
        }
    })
})

Data.DatabaseCreateConnection = async (name)=>{
    let conn = Data.DatabasePoolCluster.add(name, {
        ...MYSQL_DATA, stream: await SSHstream()
    })
    return await Data.DatabaseGetConnection(name)
}

let SSHDBconnect = async ()=>{
    Data.Database = await Data.DatabaseCreateConnection('main')
    Data.Database_Slave = await Data.DatabaseCreateConnection('slave')
    Data.Database_Slave2 = await Data.DatabaseCreateConnection('slave2')

    Data.Database_UserStatsFreeze = await Data.DatabaseCreateConnection('userstats')

}

Data.SSHDBconnect = SSHDBconnect;
module.exports = Data;