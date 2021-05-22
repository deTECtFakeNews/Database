const Connection = require("./Data");
const TweetModel = require("./Models/Tweet/TweetModel");
const UserModel = require("./Models/User/UserModel");
const TweetService = require("./Services/Tweet/TweetService");
const UserService = require("./Services/User/UserService");
Connection.connect().then(async ()=>{
    /* TweetService.stream(undefined, {
        onResult: async t => {
            try{
                let tweet = new TweetModel(t);
                // await tweet.readSelf();
                console.log('AAAAA')
                await tweet.upload({uploadFollowers: true});
            } catch(e) {
                console.log(e)
            }
        }
    }) */
    UserService.stream(undefined, {
        onResult: async u => {
            try {
                let user = new UserModel(u);
                await user.upload({uploadFollowers: true})
            } catch (e) {
                console.log(e)
            }
        }
    })
    /* function test(){
        Connection.Twitter.get('application/rate_limit_status', (error, res)=>{
            if(error) console.error(error)
            else{
                console.log(res.resources)
            }
        })
    } */
    test();
})
