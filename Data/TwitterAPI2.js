const TwitterClient = require("twitter");

const rateLimits = {
    'users/show': 90, 
    'followers/ids': 15, 
    'statuses/show/:id': 900, 
    'statuses/oembed': 0, 
    'statuses/retweets/:id': 75, 
    'search/tweets': 180
}


class TwitterClientExtended {
    constructor(props){
        super(props)
    }
    get(path, params, callback){
        
    }
}