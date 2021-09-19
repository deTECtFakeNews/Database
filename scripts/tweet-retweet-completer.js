const Connection = require("../Data");
const TweetModel = require("../Models/Tweet/TweetModel");

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
            await tweet.retweets.getFromAPIAndUploadToDatabase();
            console.log(tweet.tweetID, 'Success')
        } catch(e){
            console.log(tweet.tweetID, 'Error', e);
        }
        Connection.connections['tweet-main-read'].resume();
    })
})