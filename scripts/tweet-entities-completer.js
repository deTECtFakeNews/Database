const Connection = require("../Data");
const {TweetEntitiesModelBuffer, TweetEntitiesModel} = require("../Models/Tweet/TweetEntitiesModel");
const TweetModel = require("../Models/Tweet/TweetModel");
const UserModel = require("../Models/User/UserModel");
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
            SELECT
                TweetEntities.*,
                SUM(CASE WHEN type = 'mention' THEN 1 ELSE 0 END) as 'screenName_count',
                SUM(CASE WHEN type = 'userMention' THEN 1 ELSE 0 END) as 'userID_count'
            FROM TweetEntities
            WHERE type='mention' OR type='userMention'
            AND 'userID_count'=0 
            GROUP BY TweetEntities.tweetID
            ORDER BY value DESC;
        `).on('result', async ({tweetID, value: screenName})=>{
            try{
                if(Object.keys(existingIDs).length > 300) existingIDs = {};
                if(nonexistingIDs[screenName] != undefined) throw "user not in db";
                let userID = existingIDs[screenName];
                if(userID == undefined){
                    let user = await UserService.read({screenName: screenName});
                    userID = user?.[0]?.userID;
                    existingIDs[screenName] = userID;
                }
                if(userID == undefined){
                    try{
                        let userData = await UserService.fetchAPIWithUsername(screenName);
                        let user = new UserModel(userData);
                        await user.uploadToDatabase();
                        existingIDs[screenName] = user.userID;
                        userID = user.userID;
                    } catch(e){
                        nonexistingIDs[screenName] = true;
                        throw "user not in api";
                    }
                }
                console.log(screenName, userID);
    
                let entity = new TweetEntitiesModel({tweetID});
                entity.push({type: 'userMention', value: userID});
    
                await entitiesBuffer.push(entity);
            } catch(e){
                console.log('Error uploading', e);
            }
        }).on('end', async ()=>{
            await mentionsBuffer.uploadToDatabase();
        })
    } catch(e){

    }

})