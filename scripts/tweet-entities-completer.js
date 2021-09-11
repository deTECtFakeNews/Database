const Connection = require("../Data");
const {TweetEntitiesModelBuffer, TweetEntitiesModel} = require("../Models/Tweet/TweetEntitiesModel");
const TweetModel = require("../Models/Tweet/TweetModel");
const TweetEntityService = require("../Services/Tweet/TweetEntityService");
const UserService = require("../Services/User/UserService");

// const order = process.argv[2] || 'asc'



Connection.Database.connect().then(async ()=>{
    let entitiesBuffer = new TweetEntitiesModelBuffer(30);
    try{
        await Connection.connections['tweet-entities-read'].query(`
            SELECT
                Tweet.*
            FROM TweetEntities
            RIGHT JOIN Tweet USING (tweetID)
            WHERE TweetEntities.tweetID IS NULL
            AND (Tweet.fullText REGEXP 'https:' OR Tweet.fullText REGEXP '(#\\w)|(@\\w)')
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
                console.error("Could not upload last chunk")
            }
        })
    } catch(e){

    }

    let mentionsEntitiesBuffer = new TweetEntitiesModelBuffer(30);
    let userIDs = {};
    await TweetEntityService.stream({type: 'mention'}, {
        onResult: async row => {
            let screenName = row.value;
            try{
                let userID = userIDs[screenName];
                if(userID == undefined){
                    let user = await UserService.read({screenName: screenName});
                    userID = user?.[0]?.userID;
                    userIDs[screenName] = userID;
                }
                if(userID == undefined) throw "User not found in db";

                console.log(screenName, userID);

                let entity = new TweetEntitiesModel({
                    tweetID: row.tweetID
                });

                entity.push({
                    type: 'userMention',
                    value: userID,
                });

                // await entity.uploadToDatabase();
                await mentionsEntitiesBuffer.push(entity);

            } catch(e){
                console.log('Error uploading', e)
            }
        },
        onEnd: async () => {
            try{
                await mentionsEntitiesBuffer.push(entity);
            } catch(e){

            }
        }
    })

})