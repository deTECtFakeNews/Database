const Data = require("./Data");
const QueryModel = require("./Models/QueryModel");
const TweetModel = require("./Models/TweetModel");
const TweetService = require("./Services/TweetService");
const UserService = require("./Services/UserService");

const delay = ms => new Promise(res => setTimeout(res, ms));


Data.SSHDBconnect().then(async()=>{
    /* Data.Twitter.get('application/rate_limit_status.json', (err, data, res)=>{
        {
            let {limit, remaining, reset} = data.resources.friendships['/friendships/show']
            reset = new Date(reset*1000)
            console.log('/friendships/show', {limit, remaining, reset});
        }
        {
            let {limit, remaining, reset} = data.resources.statuses['/statuses/retweets/:id']
            reset = new Date(reset*1000)
            console.log('/statuses/retweets', {limit, remaining, reset});
        }
    }) */

    TweetService.readStream(undefined, {
        onResult: async row => {
            console.log("Tweet");
            Data.Database.pause();
            try{
                const tweet = new TweetModel(row);
                const retweets = await tweet.getRetweets();
                console.log(`Getting retweets of ${tweet.tweetID}`)
                for(let retweet of retweets){
                    await TweetService.TweetRetweet.create(retweet)
                }
                await delay(10*1000);
            } catch (e){
                console.error(e)
            }
            Data.Database.resume();
        }
    })

    UserService.readStream(undefined, {
        onResult: async row => {
            console.log("User");
            Data.Database.pause()
            try{
                let followers = await UserService.readStreamAndFetchFollowers(row.userID);
                await delay(10*1000);
            } catch(e){
                console.error(e)
            }
            Data.Database.resume()
        }
    })

})