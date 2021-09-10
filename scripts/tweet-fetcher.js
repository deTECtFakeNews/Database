const Connection = require("../Data");
const TweetModel = require("../Models/Tweet/TweetModel");
const TweetService = require("../Services/Tweet/TweetService");

Connection.Database.connect().then(async ()=>{
    const tweets = [
        '1355133233315393538'
    ]

    for(let tweetID of tweets){
        await TweetService.stream(tweetID, {
            onResult: async t => {
                const tweet = new TweetModel(t);
                console.log(tweet.getJSON());
                // Get retweets
                try{
                    await tweet.retweets.getFromAPI();
                    await tweet.retweets.uploadToDatabase();
                    console.log(tweet.retweets)
                } catch(e){ }
            }
        })
    }

    process.exit()
/*     await TweetService.stream(process.argv[2], {
        onResult: async t => {
            const tweet = new TweetModel(t);
            console.log(tweet.getJSON())
            // Get retweets
            await tweet.retweets.getFromAPI();
            await tweet.retweets.uploadToDatabase();
            console.log(tweet.retweets)
        }, 
        onEnd: process.exit.bind(this)
    }) */
})