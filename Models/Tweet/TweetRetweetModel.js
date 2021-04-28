const TweetRetweetService = require("../../Services/Tweet/TweetRetweetService");
// const TweetModel = require("./TweetModel");


console.log(TweetModel)

// TweetModel
class TweetRetweetModel{
    /**@type {String} */
    tweetID;
    /**@type {Array<TweetModel>} */
    latestRetweets;
    /**@type {Array<TweetModel>} */
    savedRetweets;
    constructor({tweetID}){
        this.tweetID = tweetID;
    }
    async fetchFromAPI(){
        if(this.tweetID == -1) return;
        try{
            this.latestRetweets = (await TweetRetweetService.fetchAPI(this.tweetID))
                .map(t => new TweetModel(t))
            return this.latestRetweets;
        } catch(e){
            console.log('Could not fetch retweets', e)
        }
    }
    async read(){
        if(this.tweetID == -1) return;
        try{
            this.savedRetweets = (await TweetRetweetService.read(this.tweetID)).map(t=>new TweetModel(t));
            return this.savedRetweets;
        } catch(e){

        }
    }
    async upload(){
        if(this.tweetID == -1) return;
        try{
            for(let retweet of this.latestRetweets){
                console.log('RT: Updated tweet', retweet.tweetID)
                if( retweet.author.stats.latestStats.followerCount > 30 ){
                    await TweetRetweetService.create({authorID: retweet.authorID, creationDate: retweet.creationDate, tweetID: retweet.tweetID});
                    await retweet.author.upload();
                }
            }
        } catch(e){

        }
    }
    
}

module.exports = TweetRetweetModel;