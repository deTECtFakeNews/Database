const CONSTANTS = require('./constants');
const TwitterClient = require('twitter');
const SystemService = require('../Services/System/SystemService');

class TwitterClientEndpoint {
    static compareTime = new Date();
    constructor({remainingCalls, limitReset, hasExecuted} = {}){
        this.remainingCalls = remainingCalls;
        this.limitReset = limitReset || new Date();
        this.hasExecuted = false;
    }
    getDelay(){
        this.delayTime = (this.limitReset - new Date())/this.remainingCalls;
        this.delayTime = this.delayTime > 0 ? this.delayTime : 0
        return  this.delayTime;
    }
}

class TwitterClientExtended extends TwitterClient{
    static counter = 0;
    static getEnpoint(path){
        if(/statuses\/retweets\/\d+/.test(path) || path == 'statuses/retweets') return 'statuses/retweets/:id';
        if(/statuses\/show\/\d+/.test(path)) return 'statuses/show/:id';
        return path;
    }
    executions = {
        'users/show': new TwitterClientEndpoint({remainingCalls: 90}),
        'followers/ids': new TwitterClientEndpoint({remainingCalls: 15}),
        'statuses/show/:id': new TwitterClientEndpoint({remainingCalls: 900}),
        'statuses/oembed': new TwitterClientEndpoint({remainingCalls: 0}),
        'statuses/retweets/:id': new TwitterClientEndpoint({remainingCalls: 75}),
        'search/tweets': new TwitterClientEndpoint({remainingCalls: 180}),
        'application/rate_limit_status': new TwitterClientEndpoint({remainingCalls: 180})
    }
    constructor(props){
        super(props);
        this.id = TwitterClientExtended.counter;
        TwitterClientExtended.counter++;
    }
    getDelay(endpoint){
        return this.executions[endpoint].getDelay();
    }
    async delay(endpoint){
        let remainingTime = this.executions[endpoint].getDelay();
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
                this.executions[endpoint].limitReset = new Date(response.headers['x-rate-limit-reset']*1000)
                console.log(`🌐${this.id} ${endpoint}  🕖 ${this.executions[endpoint].delayTime} with ${this.executions[endpoint].remainingCalls} left`)
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
        let client = this.clients.reduce((a, b) => a?.getDelay(endpoint) < b?.getDelay(endpoint) ? a : b);
        console.log();
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