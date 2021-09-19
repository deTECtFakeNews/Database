const Connection = require("../Data");
const TweetModel = require("../Models/Tweet/TweetModel");


class TweetRetweetBuffer extends Array {
    maxSize;
    constructor(maxSize){
        super();
        this.maxSize = maxSize;
    }
    async push(tweetRetweet){
        super.push(tweetRetweet);
        if(this.length >= this.maxSize){
            await this.execute();
            this.length = 0;
        }
    }
    async execute(){
        await Promise.all(this.map(element => element.getFromAPIAndUploadToDatabase()))
    }
}

let buffer = new TweetRetweetBuffer(20);

Connection.Database.connect().then(()=>{
    Connection.connections['tweet-main-read'].query(`
        SELECT
            tweetID
        FROM view_TweetStatsLast
        LEFT JOIN TweetRetweet USING (tweetID) 
        WHERE retweetCount>=20 AND TweetRetweet.authorID IS NULL
        ORDER BY retweetCount
    `).on('result', async row => {
        Connection.connections['tweet-main-read'].pause();
        let tweet = new TweetModel(row)
        try{
            await tweet.latestStats.getFromDatabase();
            console.log(tweet.tweetID, tweet.latestStats.last().getJSON());
            // await tweet.retweets.getFromAPIAndUploadToDatabase();
            await buffer.push(tweet.retweets)
            console.log(tweet.tweetID, 'Success')
        } catch(e){
            console.log(tweet.tweetID, 'Error', e);
        }
        Connection.connections['tweet-main-read'].resume();
    })
})