
class MemoryModel {
    /**@type {Object.<String, import("./Tweet/TweetModel")>} */
    tweets;
    /**@type {Object.<String, UserModel>} */
    users;
    constructor(){
        this.tweets = {};
        this.users = {};
    }

    copyFromMemory(memory){
        const {tweets, users} = memory;
        Object.keys(users).forEach(userID => {
            this.addUser( users[userID] )
        })
        // Add previous tweets
        Object.keys(tweets).forEach(tweetID => {
            this.addTweet( tweets[tweetID] )
        })
        return this;
    }

    addTweet(tweet){
        if(this.tweets[tweet.tweetID]) return this;
        // Store this tweet
        this.tweets[tweet.tweetID] = tweet;
        // Change memory to this
        this.tweets[tweet.tweetID]._memory = this.copyFromMemory(tweet._memory);
        // Add previous users
        
        return this;
    }
    addUser(user){
        if(this.users[user.userID]) return this;
        // Copy all values from memory
        // Store this tweet
        this.users[user.userID] = user;
        // Change memory to this
        this.users[user.userID]._memory = this.copyFromMemory(user._memory);
        // Add previous users
        return this;
    }
}

module.exports = MemoryModel;