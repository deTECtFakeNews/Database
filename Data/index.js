const CONSTANTS = require('./constants');
const mysql = require('mysql2');
const {Client} = require('ssh2');
const Twitter = require('./TwitterAPI');

const DatabasePoolCluster = mysql.createPoolCluster();

/** Establish connection with SSH */
const streamSSH = () => new Promise((resolve, reject) => {
    // Create client
    const client = new Client();
    // Connect to client
    client.connect(CONSTANTS.ssh);
    client
        // Type password
        .on('keyboard-interactive', (name, instructions, lang, prompts, finish) => {
            finish([CONSTANTS.ssh.password]);
        })
        // When ready
        .on('ready', ()=>{
            console.log("Server :: SSH Connection ready");
            // Forward connection
            client.forwardOut(
                CONSTANTS.ssh.host, CONSTANTS.mysql.port, 
                CONSTANTS.mysql.host, CONSTANTS.mysql.port,
                (err, stream) => { if(err) reject(err); resolve(stream) }
            )
        })
        .on('error', console.error)
        .on('close', async e => {
            console.log("Server :: SSH Connection closed", e);
            await streamSSH();
        })
});

/** Gets a connection from `DatabasePoolCluster` 
  * @param {String} name Name of the connection to create
  * @returns {mysql.PoolConnection}
  */
const getDatabaseConnection = (name) => new Promise((resolve, reject) => {
    DatabasePoolCluster.getConnection(name, async (err, connection) => {
        if(err) {
            connection?.release();
            if( err.message == 'Pool does Not exists.' ){
                try{
                    resolve( await createDatabaseConnection(name) )
                } catch (e) {
                    reject(e)
                }
            } else {
                reject(err);
            }
        } else {
            console.log(`Server :: DB Connection ready (${connection.connectionId}) - ${name}`);
            connection.connect();
            resolve(connection);
        }
    })
});

/**
 * Creates a connection to database in `DatabasePoolCluster`
 * @param {String} name Name of the connection to create
 * @returns {mysql.PoolConnection}
 */
const createDatabaseConnection = async (name) => {
    DatabasePoolCluster.add(name, {
        stream: await streamSSH(), 
        ...CONSTANTS.mysql
    });
    return await getDatabaseConnection(name);
}

const connections = {}

const connect = async () => {
    // connections['main'] = await createDatabaseConnection('main');
    // USERS
    connections['user-main-read'] = await createDatabaseConnection('user-main-read');
    connections['user-main-write'] = await createDatabaseConnection('user-main-write');
    // USERS-STATS
    connections['user-stats-read'] = await createDatabaseConnection('user-stats-read');
    connections['user-stats-write'] = await createDatabaseConnection('user-stats-write');
    // USERS-FOLLOWERS  
    connections['user-followers-write'] = await createDatabaseConnection('user-followers-write');
    connections['user-followers-read'] = await createDatabaseConnection('user-followers-read');

    connections['tweet-main-write'] = await createDatabaseConnection('tweet-main-write');
    connections['tweet-main-read'] = await createDatabaseConnection('tweet-main-read');
    connections['tweet-main-read-2'] = await createDatabaseConnection('tweet-main-read-2');
    
    connections['tweet-entities-write'] = await createDatabaseConnection('tweet-entities-write');
    connections['tweet-entities-read'] = await createDatabaseConnection('tweet-entities-read');

    connections['tweet-retweet-write'] = await createDatabaseConnection('tweet-retweet-write');
    connections['tweet-retweet-read'] = await createDatabaseConnection('tweet-retweet-read');

    connections['tweet-stats-write'] = await createDatabaseConnection('tweet-stats-write');
    connections['tweet-stats-read'] = await createDatabaseConnection('tweet-stats-read');

    connections['query-main-read'] = await createDatabaseConnection('query-main-read');
    connections['query-main-write'] = await createDatabaseConnection('query-main-write');
    
    connections['query-tweet-read'] = await createDatabaseConnection('query-tweet-read');
    connections['query-tweet-write'] = await createDatabaseConnection('query-tweet-write');
}
module.exports = {
    DatabasePoolCluster, 
    getDatabaseConnection, 
    createDatabaseConnection, 
    connect, 
    connections,
    Twitter
}