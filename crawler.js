const Connection = require("./Data");
const TweetModel = require("./Models/Tweet/TweetModel");
const UserModel = require("./Models/User/UserModel");
const TweetService = require("./Services/Tweet/TweetService");
const UserService = require("./Services/User/UserService");
Connection.connect().then(()=>{
    TweetService.stream(undefined, {
        onResult: async t => {
            let tweet = new TweetModel(t);
            try{
                await tweet.fetchSelfFromAPI();
                await tweet.stats.upload();
            	if(tweet.stats.latestStats?.retweetCount >= 20){
			await tweet.retweets.fetchFromAPI();
			await tweet.retweets.upload();
			console.log('Added rts')
		}
	    } catch (e){
                console.log(`Error uploading tweet stats`, e)
            }
            try{
                await tweet.author.stats.fetchFromAPI();
                await tweet.author.stats.upload();
                if(tweet.author.stats?.latestStats?.followersCount > 10000){
                    await tweet.author.followers.read();
                    if(tweet.author.followers.savedFollowers.length==0){
                        await tweet.author.followers.fetchFromAPI();
                        await tweet.author.followers.upload();
                    }
                }
            } catch(e){
                console.log(`Error uploading user stats`, e)
            }
            console.log(`Tweet ${tweet.tweetID} with author ${tweet.author.userID}`);
        }
    })
})
