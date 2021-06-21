const CONSTANTS = require('./constants');
const TwitterClient = require('twitter');
const SystemService = require('../Services/System/SystemService');

class TwitterClientEndpoint {
    constructor({remainingCalls, limitReset} = {}){
        this.remainingCalls = remainingCalls;
        this.limitReset = limitReset || new Date();
    }
    getDelay(){
        // Default to 15 seconds
        if(this.remainingCalls == 0 || this.remainingCalls == undefined){
            this.delayTime = 15*1000;
        } else {
            this.delayTime = (this.limitReset - new Date())/this.remainingCalls;
            this.delayTime = this.delayTime > 0 ? this.delayTime : 0
        }
        return this.delayTime;
    }
}
// TwitterClient.prototype.options = 
class TwitterClientExtended extends TwitterClient{
    static counter = 0;
    static getEnpoint(path){
        if(/(?:(?:\d\.*)+(?:\/\:*\w+)+)/.test(path) == false ) path = "1.1/"+path;
        if(/1\.1\/statuses\/retweets\/\d+/.test(path) || path == '1.1/statuses/retweets') return '1.1/statuses/retweets/:id';
        if(/1\.1\/statuses\/show\/\d+/.test(path)) return '1.1/statuses/show/:id';
        if(/2\/tweets\/search\/all/.test(path)) return '2/tweets/search/all';
        if(/2\/tweets\/search\/recent/.test(path)) return '2/tweets/search/recent';
        return path;
    }
    executions = {
        '1.1/users/show': new TwitterClientEndpoint({remainingCalls: 90}),
        '1.1/followers/ids': new TwitterClientEndpoint({remainingCalls: 15}),
        '1.1/statuses/show/:id': new TwitterClientEndpoint({remainingCalls: 900}),
        '1.1/statuses/oembed': new TwitterClientEndpoint({remainingCalls: 0}),
        '1.1/statuses/retweets/:id': new TwitterClientEndpoint({remainingCalls: 75}),
        '1.1/search/tweets': new TwitterClientEndpoint({remainingCalls: 180}),
        '1.1/application/rate_limit_status': new TwitterClientEndpoint({remainingCalls: 180}),
        '2/tweets/search/all': new TwitterClientEndpoint({remainingCalls: 300}),
        '2/tweets/search/recent': new TwitterClientEndpoint({remainingCalls: 300}),
        '1.1/tweets/search/fullarchive/development': new TwitterClientEndpoint({remainingCalls: 300}),
    }
    constructor(props){
        super({...props, rest_base: 'https://api.twitter.com'});
        this.id = TwitterClientExtended.counter;
        this.fullArchiveAccess = props.fullArchiveAccess || false;
        TwitterClientExtended.counter++;
    }
    getDelay(endpoint){
        if(endpoint == '2/tweets/search/all' && this.fullArchiveAccess == false) return 1e10;
        return this.executions[endpoint].getDelay();
    }
    async delay(endpoint){
        let remainingTime = this.executions[endpoint].getDelay();
        await SystemService.delay(remainingTime);
        return 0;
    }

    get(path, ...args){
        // Add 1.1 default
        let endpoint = TwitterClientExtended.getEnpoint(path);
        if(/(?:(?:\d\.*)+(?:\/\:*\w+)+)/.test(path) == false ) path = "1.1/"+path;
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
                if(response == undefined) return this.get(path, ...args);
                this.executions[endpoint].remainingCalls = response.headers['x-rate-limit-remaining'];
                this.executions[endpoint].limitReset = new Date(response.headers['x-rate-limit-reset']*1000)
                console.log(`🌐${this.id} ${endpoint}  🕖 ${this.executions[endpoint].delayTime} with ${this.executions[endpoint].remainingCalls} left`)
                callback(error, data, response);
            })
        })
    }
    post(path, ...args){
        // Add 1.1 dfault
        let endpoint = TwitterClientExtended.getEnpoint(path);
        if(/(?:(?:\d\.*)+(?:\/\:*\w+)+)/.test(path) == false ) path = "1.1/"+path;
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
            super.post(path, params, (error, data, response)=>{
                if(response == undefined) return this.post(path, ...args);
                this.executions[endpoint].remainingCalls = response.headers['x-rate-limit-remaining'];
                this.executions[endpoint].limitReset = new Date(response.headers['x-rate-limit-reset']*1000)
                console.log(`🌐${this.id} ${endpoint}  🕖 ${this.executions[endpoint].delayTime} with ${this.executions[endpoint].remainingCalls} left`)
                callback(error, data, response);
            })
        })
    }
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