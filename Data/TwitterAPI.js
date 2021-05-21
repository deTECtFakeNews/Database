const CONSTANTS = require('./constants');
const TwitterClient = require('twitter');
const SystemService = require('../Services/System/SystemService');

class TwitterClientExtended extends TwitterClient{
    static counter = 0;
    static rateLimits = {
        'users/show': (15/90)*60*1000,
        'followers/ids': (15/15)*60*1000, 
        'statuses/show/:id': (15/900)*60*1000,
        'statuses/oembed': 0,
        'statuses/retweets/:id': (15/75)*60*1000,
        'search/tweets': (15/180)*60*1000 
    }
    static getEnpoint(path){
        if(/statuses\/retweets\/\d+/.test(path) || path == 'statuses/retweets') return 'statuses/retweets/:id';
        if(/statuses\/show\/\d+/.test(path)) return 'statuses/show/:id';
        return path;
    }
    executions = {
        'users/show': {
            remainingCalls: 90, limitReset: new Date(0)
        },
        'followers/ids': {
            remainingCalls: 15, limitReset: new Date(0)
        },
        'statuses/show/:id': {
            remainingCalls: 900, limitReset: new Date(0)
        },
        'statuses/oembed': {
            remainingCalls: 0, limitReset: new Date(0)
        },
        'statuses/retweets/:id': {
            remainingCalls: 75, limitReset: new Date(0)
        },
        'search/tweets': {
            remainingCalls: 180, limitReset: new Date(0)
        },
    }
    constructor(props){
        super(props);
        this.id = TwitterClientExtended.counter;
        TwitterClientExtended.counter++;
    }
    getRemainingTime(endpoint){
        let remainingTime = (this.executions[endpoint].limitReset.getTime() - new Date().getTime())/this.executions[endpoint].remainingCalls;
        if(remainingTime<0) remainingTime = 0;
        return remainingTime;
    }
    async delay(endpoint){
        let remainingTime = this.getRemainingTime(endpoint);
        await SystemService.delay(remainingTime);
        return 0;
    }

    get(path, ...args){
        let endpoint = TwitterClientExtended.getEnpoint(path);
        this.delay(endpoint).then(()=>{
            let callback;
            let params;
            if(typeof args[0] == 'function'){
                callback = args[0];
                params = {};
            }
            if(typeof args[0] == 'object' && typeof args[1] == 'function'){
                callback = args[1];
                params = args[0]
            }
            super.get(path, params, (error, data, response)=>{
                this.executions[endpoint].remainingCalls = response.headers['x-rate-limit-remaining'];
                this.executions[endpoint].limitReset = new Date(0);
                this.executions[endpoint].limitReset.setUTCSeconds(response.headers['x-rate-limit-reset'])
                callback(error, data, response);
            })
        })
    }

  /*   async get(path, params){
        let endpoint = TwitterClientExtended.getEnpoint(path);
        await this.delay(endpoint);
        return await super.get(path, params)
    } */
    
    post(path, ...args){
        let endpoint = TwitterClientExtended.getEnpoint(path);
        this.delay(endpoint).then(()=>{
            super.post(path, ...args);
        })
    }
    
/*     async post(path, params){
        let endpoint = TwitterClientExtended.getEnpoint(path);
        await this.delay(endpoint);
        return await super.post(path, params)
    } */
}

class Twitter {
    /** @type {Array<TwitterClientExtended>} */
    clients = []
    constructor(clients){
        this.clients = clients.map(d => new TwitterClientExtended(d));
    }
    getFastestClientByEndpoint(endpoint){
        let client = this.clients.reduce((a, b) => a?.getRemainingTime(endpoint) < b?.getRemainingTime(endpoint) ? a : b);
        console.log('🌐'+client.id, endpoint, client.getRemainingTime(endpoint));
        if(endpoint == 'followers/ids'){
            process.stdout.write('\u0007')
            //console.log('\u0007')
        }
        return client;
    }
    async delay(){ return 0; }
    get(path, ...args){
        const client = this.getFastestClientByEndpoint(TwitterClientExtended.getEnpoint(path));
        return client.get(path, ...args);
    }
    post(path, ...args){
        const client = this.getFastestClientByEndpoint(TwitterClientExtended.getEnpoint(path));
        return client.post(path, ...args);
    }
}



module.exports = new Twitter(CONSTANTS.twitter);