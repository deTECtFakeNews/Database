const Connection = require("./Data");
const TweetModel = require("./Models/Tweet/TweetModel");
const UserModel = require("./Models/User/UserModel");
const TweetService = require("./Services/Tweet/TweetService");
const UserService = require("./Services/User/UserService");
Connection.connect().then(async ()=>{
    TweetService.stream(undefined, {
        onResult: async t => {
            try{
                let tweet = new TweetModel(t);
                // await tweet.readSelf();
                console.log('AAAAA')
                await tweet.upload();
            } catch(e) {
                console.log(e)
            }
        }
    })
})
