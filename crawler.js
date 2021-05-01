const Connection = require("./Data");
const TweetModel = require("./Models/Tweet/TweetModel");
const UserModel = require("./Models/User/UserModel");
const TweetService = require("./Services/Tweet/TweetService");
const UserService = require("./Services/User/UserService");
Connection.connect().then(()=>{
    /* UserService.stream(undefined, {
        onResult: async row => {
            try{
                console.log('Updating followers for user', row.userID)
                let user = new UserModel(row);
                await user.stats.fetchFromAPI();
                await user.stats.upload();
                if(user.stats.latestStats?.followersCount > 10000){
                    await user.followers.read();
                    if(user.followers.savedFollowers.length == 0){
                        await user.followers.fetchFromAPI();
                        await user.followers.upload();
                    }
                }
                console.log('Uploaded followers for user ', user.userID)
            } catch(e){
                console.log('Error', e);
            }
        }
    }) */
    TweetService.stream(undefined, {
        onResult: async t => {
            let tweet = new TweetModel(t);
            /* try{
                await tweet.fetchSelfFromAPI();
                await tweet.stats.upload();
            } catch (e){
                console.log(`Error uploading tweet stats`, e)
            }
            try{
                await tweet.author.stats.fetchFromAPI();
                await tweet.author.stats.upload();
                console.log(tweet.author.stats)
                if(tweet.author.stats?.latestStats?.followersCount > 10000){
                    await tweet.author.followers.read();
                    if(tweet.author.followers.savedFollowers.length==0){
                        await tweet.author.followers.fetchFromAPI();
                        await tweet.author.followers.upload();
                    }
                }
            } catch(e){
                console.log(`Error uploading user stats`, e)
            } */
            await tweet.getAuthor();
            console.log(`Tweet ${tweet.tweetID} with author ${tweet.author.userID}`);
        }
    })
})