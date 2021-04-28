const Connection = require('./index')
const UserService = require("../Services/User/UserService");
const UserModel = require('../Models/User/UserModel');
const TweetService = require('../Services/Tweet/TweetService');
const TweetModel = require('../Models/Tweet/TweetModel');
const QueryService = require('../Services/Query/QueryService');
const QueryModel = require('../Models/Query/QueryModel');
const SystemService = require('../Services/System/SystemService');

Connection.connect().then(()=>{
    /* TweetService.stream(undefined, {
        onResult: async r => {
            try{
                let tweet = new TweetModel(r);
                await tweet.fetchFromAPI();
                await tweet.upload();
                console.log('Updated tweet', tweet.tweetID);
                // console.log(tweet.entities.entities)
            } catch(e){
                console.error('Could not upload tweet', r.tweetID, e)
            }
        }
    }) */
    /* UserService.stream(undefined, {
        onResult: async r =>{
            try{
                let user = new UserModel(r);
                await user.fetchFromAPI();
                console.log(user.userID)
            } catch(e){

            }
        }
    }) */
    /* QueryService.stream(undefined, {
        onResult: async r => {
            // console.log(r)
            console.log("===================================")
            console.log("===================================")
            console.log("===================================")
            let query = new QueryModel(r);
            // console.log(query)
            if(query.shouldExecute){
                await query.execute();
                for(let tweet of query.latestTweets){
                    console.log(tweet)
                }
            }
        }
    }) */
    SystemService.fetchSpreadsheet('1Hpb_UJ_VBHktK18qrxoYKUwMrRFbd6VECgIO52XlrAI', 1).then(d=>{
        console.log(d)
    })
})
