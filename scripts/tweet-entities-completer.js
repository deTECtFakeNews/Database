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
            try{gi
                await entitiesBuffer.uploadToDatabase();
            } catch(e){
                console.error("Could not upload last chunk")
            }
        })
    } catch(e){

    }

    try{
        let mentionsBuffer = new TweetEntitiesModelBuffer(30);
        let existingIDs = {};
        let nonexistingIDs = {};
        await Connection.connections['tweet-entities-read'].query(`
            SELECT * FROM (
                SELECT tweetID, value AS 'screenName' FROM TweetEntities WHERE type='mention'
            ) AS screenNameEntities
            LEFT JOIN (
                SELECT tweetID, value AS 'userID' FROM TweetEntities WHERE type='UserMention'
            ) AS userIDEntities USING (tweetID)
            WHERE userIDEntities.userID IS NULL
            ORDER BY screenName;
        `).on('result', async ({tweetID, screenName})=>{
            try{
                let userID = existingIDs[screenName];
                if(nonexistingIDs[screenName] != undefined) throw "user not in db";
                if(userID == undefined){
                    let user = await UserService.read({screenName: screenName});
                    userID = user?.[0]?.userID;
                    existingIDs[screenName] = userID;
                }
                if(userID == undefined){
                    nonexistingIDs[screenName] = true;
                    throw "user not in db";
                }
                console.log(screenName, userID);
    
                let entity = new TweetEntitiesModel({tweetID});
                entity.push({type: 'userMention', value: userID});
    
                await entitiesBuffer.push(entity);
            } catch(e){
                console.log('Error uploading', e);
            }
        }).on('end', async ()=>{
            await mentionsEntitiesBuffer.push(entity);
        })
    } catch(e){

    }

/* 
    let mentionsEntitiesBuffer = new TweetEntitiesModelBuffer(30);
    let userIDs = {};
    let userIDsNotInDB = {};
    await TweetEntityService.stream({type: 'mention'}, {
        onResult: async row => {
            let screenName = row.value;
            try{
                if(Object.keys(userIDs).length == 200) userIDs = {};
                if(Object.keys(userIDsNotInDB).length == 200) userIDsNotInDB = {};
                if(userIDsNotInDB[screenName] != undefined) throw "User not found in db";
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
    }) */

})