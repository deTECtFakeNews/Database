const Connection = require("../Data");
const TweetModel = require("../Models/Tweet/TweetModel");

Connection.Database.connect().then(()=>{
    /* Connection.connections['tweet-main-read'].query(`
        SELECT 
            Tweet.*
        FROM TweetStatsFreeze
        RIGHT JOIN Tweet USING (tweetID)
        WHERE
            TweetStatsFreeze.tweetID IS NULL
    `).on('result', async (row)=>{
        Connection.connections['tweet-main-read'].pause();
        let tweet = new TweetModel(row);
        try{
            await tweet.getFromAPI();
            await tweet.latestStats.uploadToDatabase();
            await tweet.entities.uploadToDatabase();
            console.log(tweet.tweetID, 'Success');
        } catch(e){
            console.log(tweet.tweetID, 'Error');
        }
        Connection.connections['tweet-main-read'].resume();
    }); */
    Connection.connections['tweet-main-read'].query(`
        SELECT
            Tweet.*
        FROM view_TweetStatsLast
        LEFT JOIN TweetRetweet USING (tweetID)
        JOIN Tweet USING (tweetID)
        WHERE TweetRetweet.tweetID IS NULL AND view_TweetStatsLast.retweetCount>=20;
    `).on('result', async (row)=>{
        Connection.connections['tweet-main-read'].pause();
        let tweet = new TweetModel(row);
        try{
            await tweet.retweets.getFromAPI();
            await tweet.retweets.uploadToDatabase();
        } catch(e){
            console.log(tweet.tweetID, 'Error uploading retweets')
        }
        Connection.connections['tweet-main-read'].resume();
    })
})