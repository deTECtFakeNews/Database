const Connection = require("../Data");
const {TweetEntitiesModelBuffer} = require("../Models_new/Tweet/TweetEntitiesModel");
const TweetModel = require("../Models_new/Tweet/TweetModel");

const order = process.argv[2] || 'asc'


let entitiesBuffer = new TweetEntitiesModelBuffer(10);

Connection.Database.connect().then(()=>{
    Connection.connections['tweet-entities-read'].query(`
        SELECT
            Tweet.*
        FROM TweetEntities
        RIGHT JOIN Tweet USING (tweetID)
        WHERE TweetEntities.tweetID IS NULL
        AND Tweet.fullText REGEXP '#|@'
        GROUP BY tweetID
        ORDER BY tweetID ${order}
    `).on('result', async (row)=>{
        Connection.connections['tweet-entities-read'].pause();
        let tweet = new TweetModel(row);
        try{
            // tweet.entities.uploadToDatabase();
            await entitiesBuffer.push( tweet.entities )

        } catch(e){
            console.log(tweet.tweetID, 'Error', e);
        }
        Connection.connections['tweet-entities-read'].resume();
    }).on('end', async ()=>{
        await entitiesBuffer.uploadToDatabase();
    })
})