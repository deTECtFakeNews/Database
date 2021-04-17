const Data = require("./Data");
const QueryModel = require("./Models/QueryModel");
const TweetModel = require("./Models/TweetModel");
const UserModel = require("./Models/UserModel");
const SystemService = require("./Services/SystemService");
const TweetService = require("./Services/TweetService");
const UserService = require("./Services/UserService");

const delay = ms => new Promise(res => setTimeout(res, ms));

const FOLLOWER_MIN = 10000;

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

    /* TweetService.readStream(undefined, {
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
    }) */

    // Update followers and stats
    UserService.readStream(undefined, {
        onResult: async row => {
            if(row.userID == -1) return;
            console.log("UPDATING INFO FOR USER", row.userID);
            Data.Database.pause();
            try{
                // LIMIT IS 900 / 15 MIN -->  60 TWEETS / MIN --> wait 1 second
                await SystemService.delay(1000);

                let user = await UserModel.getFromAPI(row.userID)
                if (user.latestStats == undefined) return Data.Database.resume()
                // Upload stats
                await user._UserStatsFreeze.pushStats(user.latestStats)
                console.log("   stats done. Followers", user.latestStats.followersCount);
                // Fetch followers
                if (user.latestStats.followersCount < FOLLOWER_MIN) return Data.Database.resume();
                let countNewFollowers = 0;
                UserService.UserFollower.fetchStreamAPI(row.userID, {
                    onResult: async followerID => {
                        try{
                            await UserService.UserFollower.create({userID: row.userID, followerID});
                            countNewFollowers++;
                        } catch (e) {
                            if(e.errno != 1452) console.log(e)
                        }
                    }, 
                    onError: console.error
                })
                console.log("   followers done, added ", countNewFollowers);
                // LIMIT IS 15 / 15 MIN -->  1 TWEETS / MIN --> wait 50 seconds
                await SystemService.delay(50*1000);
            }catch(e){
                console.error(e)
            }
            return Data.Database.resume();


            Data.Database.resume();
        }
    }, {additionalSQL: 'WHERE userID NOT IN (SELECT userID FROM UserStatsFreeze GROUP BY userID)'})

/*     UserService.readStream(undefined, {
        onResult: async row => {
            if(row.userID == -1) return;
            Data.Database.pause();
            console.log(row.userID)
            try{
                UserService.UserFollower.fetchStreamAPI(row.id, {
                    onResult: async id => {
                        try{
                            // console.log(id, row.userID)
                            await UserService.UserFollower.create({userID: row.userID, followerID: id})
                            console.log(id, "follows", row.userID)
                        } catch(e){
                            if(e.code != 'ER_NO_REFERENCED_ROW_2') console.error(e);
                        }
                    },
                    onError: console.error
                })
            } catch (e) {
                console.error(e);
            }
            await SystemService.delay(1.5*60*1000);
            Data.Database.resume();
        }
    }) */

})