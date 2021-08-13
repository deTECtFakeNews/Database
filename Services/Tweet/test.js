const Connection = require("../../Data");
const TweetService = require("./new_TweetService");

Connection.Database.connect().then(()=>{
    TweetService.stream(undefined, {
        onResult: async tweet => {
            try{
                console.log(tweet.fullText)
                let fromAPI = await TweetService.fetchAPI(tweet.tweetID);
                if(fromAPI.latestStats.retweetCount > 10) {
                    let rts = await TweetService.TweetRetweetService.fetchAPI(tweet.tweetID);
                    console.dir(rts, {depth: null});
                }

            } catch(e){console.error(e)}
        }
    })
})