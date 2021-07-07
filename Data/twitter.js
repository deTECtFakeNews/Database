const CONSTANTS = require('./constants');
const TwitterClient = require("twitter");
const SystemService = require("../Services/System/SystemService");

const normalizePath = (path) => {
    // if path is full url
    if(/^https*:\/\/api.twitter.com\//.test(path)){
        // Get content after host
        path = path.replace(/^https*:\/\/api.twitter.com\//, '');
    }
    // Remove leading / if exists
    path = path.replace(/^\/+/, '');
    // Detect if endpoint begins by version number
    let beginsWithVersionNumber = /^(?:\d\.*)+(?:\/:*\w+)+/.test(path);
    // Add default 1.1 if does not begin with version number
    if(!beginsWithVersionNumber) path = "1.1/"+path;
    // Replace end digits with :id
    let normalizedPath = path.replace(/\d+\/*$/, ':id');
    return normalizedPath;
    
}


class TwitterClientEndpoint {
    /**@type {Number} Number of remaining calls in time period */
    remainingCalls;
    /**@type {Date} Date when limit will be reset */
    limitResetDate;

    /**
     * @constructor
     * Creates an object to manage endpoint delays
     */
    constructor({remainingCalls, limitResetDate}){
        this.remainingCalls = remainingCalls;
        this.limitResetDate = limitResetDate || new Date();
    }
    /**
     * Returns the calculated delay time
     */
    getDelay(){
        // Get remaining time
        let remainingTime = this.limitResetDate.getTime() - (new Date()).getTime();
        if(this.remainingCalls == 0) return remainingTime + 10;
        // Get only possitive values
        if(remainingTime <= 0) remainingTime = 0;
        // Divide remaining time into remaining calls
        let delayTime = remainingTime/this.remainingCalls;
        return delayTime;
        // Return delay time divided by number of clients
    }
}

class TwitterClientExtended extends TwitterClient{
    static counter = 0;
    id;
    /**@type {{String, TwitterClientEndpoint}} Contains all available endpoints*/
    endpoints = {
        // 1.1 Users
        '1.1/users/show': new TwitterClientEndpoint({remainingCalls: 90}),
        '1.1/followers/ids': new TwitterClientEndpoint({remainingCalls: 15}),
        // 1.1 Tweets
        '1.1/statuses/show/:id': new TwitterClientEndpoint({remainingCalls: 900}),
        '1.1/statuses/retweets/:id': new TwitterClientEndpoint({remainingCalls: 75}),
        '1.1/statuses/oembed': new TwitterClientEndpoint({remainingCalls: 0}),
        // 1.1 Search
        '1.1/search/tweets': new TwitterClientEndpoint({remainingCalls: 180}),
        // 1.1 Rate limit
        '1.1/application/rate_limit_status': new TwitterClientEndpoint({remainingCalls: 180}),
        // 2 Search
        '2/tweets/search/recent': new TwitterClientEndpoint({remainingCalls: 300}),
    }
    constructor(props){
        // Initialize super with rest base api.twitter.com to allow v1 and v2
        super({...props, rest_base: 'https://api.twitter.com'});
        // Add autoincrement id
        this.id = TwitterClientExtended.counter++;
        // Add full archive search endpoints if available
        if(props?.fullArchiveAccess){
            this.endpoints['2/tweets/search/all'] = new TwitterClientEndpoint({remainingCalls: 300});
            this.endpoints['2/tweets/counts/all'] = new TwitterClientEndpoint({remainingCalls: 300});
        }
    }
    /**
     * Gets the endpoint object for the specified path
     * @param {String} path Path to be executed in api
     * @returns {TwitterClientEndpoint}
     */
    getEndpoint(path){
        let normalizedPath = normalizePath(path);
        // Get endpoint
        let endpoint = this.endpoints[normalizedPath];
        // If endpoint exists, return else raise error
        return endpoint;
        // else throw "[Connection/Twitter/TwitterClientExtended] endpoint does not exist";
    }
    // Get
    get(path, params, callback){
        try{
            // Get endpoint
            let endpoint = this.getEndpoint(path);
            // Get delay (AND DIVIDE BY THE NUMBER OF CLIENTS)
            let delay = endpoint.getDelay()/(CONSTANTS.twitter.length);
            SystemService.delay( delay ).then(()=>{
                super.get(path, params, (error, data, response) => {
                    // Throw error if response is undefined
                    if(response == undefined) throw "[Connection/Twitter/TwitterClientExtended] response is undefined";
                    // Update remaining calls and limit reset date
                    endpoint.remainingCalls = response.headers['x-rate-limit-remaining']
                    endpoint.limitResetDate = new Date(response.headers['x-rate-limit-reset']*1000) // To convert to ms
                    endpoint.getDelay();
                    // Log execution
                    console.log(`🌐${this.id} ${path} ⌛${delay}ms. (${endpoint.remainingCalls} remaining)`)
                    // Call callback
                    callback(error, data, response)
                })
            })
        } catch(e){
            throw e;
        }
    }
    // Post
    post(path, params, callback){
        try{
            // Get endpoint
            let endpoint = this.getEndpoint(path);
            // Get delay (AND DIVIDE BY THE NUMBER OF CLIENTS)
            let delay = endpoint.getDelay()/CONSTANTS.twitter.length;
            SystemService.delay( delay ).then(()=>{
                super.post(path, params, (error, data, response) => {
                    // Throw error if response is undefined
                    if(response == undefined) throw "[Connection/Twitter/TwitterClientExtended] response is undefined";
                    // Update remaining calls and limit reset date
                    endpoint.remainingCalls = response.headers['x-rate-limit-remaining']
                    endpoint.limitResetDate = response.headers['x-rate-limit-reset']*1000 // To convert to ms
                    // Log execution
                    console.log(`🌐${this.id} ${path} ⌛${delay}ms. (${endpoint.remainingCalls} remaining)`)
                    // Call callback
                    callback(error, data, response)
                })
            })
        } catch(e){
            throw e;
        }
    }
}

class TwitterPool {
    /**@type {Array<TwitterClientExtended>} Array containing all the clients*/
    clients = [];
    /**
     * Creates an object to simultaneously manage many twitter clients
     * @param {Array} clients_data Contains all the data to setup array of clients
     */
    constructor(clients_data){
        this.clients = clients_data.map(data => new TwitterClientExtended(data));
    }
    /**
     * Gets the client with the shortest wait for the specified path
     * @param {String} path Path to be executed
     */
    getAvailableClient(path){
        let client = this.clients
            .filter(client => client.getEndpoint(path) != undefined) // Filter out all unavailable clients
            .reduce((a, b) => a.getEndpoint(path).getDelay() < b.getEndpoint(path).getDelay() ? a : b) // Get smallest delay
        return client;
    }
    get(path, params, callback){
        this.getAvailableClient(path).get(path, params, callback);
    }
    post(path, params, callback){
        this.getAvailableClient(path).post(path, params, callback);
    }
}

const Twitter = new TwitterPool(CONSTANTS.twitter);
module.exports = Twitter;
