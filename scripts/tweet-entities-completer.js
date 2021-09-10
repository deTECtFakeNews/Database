const Connection = require("../Data");
const TweetModel = require("../Models_new/Tweet/TweetModel");

Connection.Database.connect().then(()=>{
    Connection.connections['tweet-entities-read'].query(`
        SELECT
            Tweet.*
        FROM TweetEntities
        RIGHT JOIN Tweet USING (tweetID)
        WHERE TweetEntities.tweetID IS NULL
        AND Tweet.fullText REGEXP '#|@'
        GROUP BY tweetID
        ORDER BY tweetID DESC
    `).on('result', async (row)=>{
        let tweet = new TweetModel(row);
        try{
            tweet.entities.uploadToDatabase();
        } catch(e){
            console.log(tweet.tweetID, 'Error');
        }
    })
})