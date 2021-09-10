const Connection = require("../Data");
const {TweetEntitiesModelBuffer} = require("../Models/Tweet/TweetEntitiesModel");
const TweetModel = require("../Models/Tweet/TweetModel");

// const order = process.argv[2] || 'asc'


let entitiesBuffer = new TweetEntitiesModelBuffer(30);

Connection.Database.connect().then(()=>{
    Connection.connections['tweet-entities-read'].query(`
        SELECT
            Tweet.*
        FROM TweetEntities
        RIGHT JOIN Tweet USING (tweetID)
        WHERE TweetEntities.tweetID IS NULL
        AND (Tweet.fullText REGEXP 'https:' OR Tweet.fullText REGEXP '(#\\w)|(@\\w)');
        GROUP BY tweetID
    `).on('result', async (row)=>{
        Connection.connections['tweet-entities-read'].pause();
        let tweet = new TweetModel(row);
        try{
            await entitiesBuffer.push( tweet.entities )
        } catch(e){
            console.log(tweet.tweetID, 'Error', e);
        }
        Connection.connections['tweet-entities-read'].resume();
        // console.log('Hi')
    }).on('end', async ()=>{
        try{
            await entitiesBuffer.uploadToDatabase();
        } catch(e){
            console.error("Could not upload last chunk", entitiesBuffer.tweetIDs)
        }
    })
})