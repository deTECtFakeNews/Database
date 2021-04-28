const CONSTANTS = require('./constants');
const _twitter = require('twitter');
const Twitter = new _twitter(CONSTANTS.twitter);

const twitterEndpoints = {
    'users/show': {
        rateLimit: (15/900)*60*1000, 
        lastExecution: new Date()
    },
    'followers/ids': {
        rateLimit: (15/15)*60*1000,
        lastExecution: new Date()
    }, 
    'statuses/show/:id': {
        rateLimit: (15/900)*60*1000,
        lastExecution: new Date()
    },
    'statuses/oembed': {
        rateLimit: 0, 
        lastExecution: new Date()
    }, 
    'statuses/retweets/:id': {
        rateLimit: (15/75)*60*1000, 
        lastExecution: new Date()
    }, 
    'search/tweets': {
        rateLimit: (15/180)*60*1000, 
        lastExecution: new Date()
    }
}

Twitter.delay = endpoint => new Promise((resolve, reject)=>{
    const timeSinceLastExecution = new Date() - twitterEndpoints[endpoint].lastExecution;
    const remainingTime = twitterEndpoints[endpoint].rateLimit - timeSinceLastExecution;
    if(remainingTime < 0) resolve();
    setTimeout(()=>{
        twitterEndpoints[endpoint].lastExecution = new Date();
        resolve();
    }, remainingTime)
})

module.exports = Twitter;