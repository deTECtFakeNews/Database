const CONSTANTS = require('./constants');
const mysql = require('mysql2');
const {Client} = require('ssh2');

class DatabaseSSHConnection {
    config;
    /**@type {Client} */
    sshClient;
    /**@type {import('mysql').Connection} */
    mysqlConnection;
    #events = {}
    constructor(config){
        this.config = config;
        // Create new client object
        this.sshClient = new Client();
        this.connect();
        this.sshClient.on('close', ()=>{
            this.#events['close']?.();
            // this.connect();
        })
    }
    connect(){
        // this.sshClient.end();
        this.sshClient.connect(this.config.ssh);
        this.sshClient
            // Manually type password
            .on('keyboard-interactive', (name, instructions, lang, prompts, finish) => {
                this.#events['ssh-client-keyboard-interactive']?.(name, instructions, lang, prompts, finish);
                finish([this.config.ssh.password])

            })
            // On ready forward connection
            .on('ready', ()=>{
                this.#events['ssh-client-ready']?.();
                this.sshClient.forwardOut(
                    // source host
                    this.config.ssh.host, 
                    // Source port
                    this.config.mysql.port, 
                    // Destination host
                    this.config.mysql.host, 
                    // Destination port
                    this.config.mysql.port,
                    // Callback
                    (error, stream)=>{
                        if(error) return this.#events['error'](error);
                        // this.sshStream = stream;
                        this.mysqlConnection = mysql.createConnection({
                            stream, 
                            ...this.config.mysql
                        })
                        this.#events['mysql-connection']?.();
                    }
                )
            })
            .on('error', (e)=>{
                console.log(e)
            })
    }
    // Event handler
    on(event, callback){
        this.#events[event] = callback;
        return this;
    }
}

class DatabaseSSHConnectionPool {
    config;
    /**@type {Object.<string, DatabaseSSHConnection>} */
    sshConnections = {};
    /**@type {Object.<string, import('mysql').Connection>} */
    connections = {};
    constructor(config){
        this.config = config;
    }
    addConnection(name){
        if(this.sshConnections[name]) return;
        return new Promise((resolve, reject) => {
            this.sshConnections[name] = new DatabaseSSHConnection(this.config);
            this.sshConnections[name].on('mysql-connection', ()=>{
                console.log('[Connection/Database] Connection established', name);
                this.connections[name] = this.sshConnections[name].mysqlConnection;
                resolve();
            })
        })
    }

    async connect(){
        // Users
        await this.addConnection('user-main-read');
        await this.addConnection('user-main-write');
        // User stats
        await this.addConnection('user-stats-read');
        await this.addConnection('user-stats-write');
        // User followers
        await this.addConnection('user-followers-read');
        await this.addConnection('user-followers-write');
        // Tweets
        await this.addConnection('tweet-main-read');
        await this.addConnection('tweet-main-write');
        // Tweet entities
        await this.addConnection('tweet-entities-read');
        await this.addConnection('tweet-entities-write');
        // Tweet retweets
        await this.addConnection('tweet-retweets-read');
        await this.addConnection('tweet-retweets-write');
        // Tweet stats
        await this.addConnection('tweet-stats-read');
        await this.addConnection('tweet-stats-write');
        // Queries
        await this.addConnection('query-main-read');
        await this.addConnection('query-main-write');
        // Query Tweet
        await this.addConnection('query-tweet-read');
        await this.addConnection('query-tweet-write');
    }
}

let Database = new DatabaseSSHConnectionPool(CONSTANTS)

module.exports = Database;