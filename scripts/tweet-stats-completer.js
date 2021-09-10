const Connection = require("../Data");
const TweetModel = require("../Models_new/Tweet/TweetModel");

Connection.Database.connect().then(()=>{
    Connection.connections['tweet-main-read'].query(`
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
    })
})