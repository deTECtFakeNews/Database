const Connection = require("./Data");
const QueryModel = require("./Models/Query/QueryModel");
const TweetModel = require("./Models/Tweet/TweetModel");
const UserModel = require("./Models/User/UserModel");
const QueryService = require("./Services/Query/QueryService");
const TweetService = require("./Services/Tweet/TweetService");
const UserService = require("./Services/User/UserService");
Connection.connect().then(async ()=>{
    /* TweetService.stream(undefined, {
        onResult: async t => {
            try{
                let tweet = new TweetModel(t);
                await tweet.fetchSelfFromAPI();
                // await tweet.upload({uploadFollowers: false, uploadRetweets: false});
            } catch(e) {
                console.log(e)
            }
        }
    }) */
    /* UserService.stream(undefined, {
        onResult: async u => {
            try {
                let user = new UserModel(u);
                await user.upload({uploadFollowers: true})
            } catch (e) {
                console.log(e)
            }
        }
    }) */
    /* function test(){
        Connection.Twitter.get('application/rate_limit_status', (error, res)=>{
            if(error) console.error(error)
            else{
                console.log(res.resources)
            }
        })
    } */
    // test();
    QueryService.stream(undefined, {
        onResult: async q => {
            try{
                let query = new QueryModel(q);
                if(query.shouldExecute){
                    await query.execute({historic: true});
                    console.log(query.latestTweets)
                }
            } catch(e){
                console.error(e)
            }
        }
    })


})
