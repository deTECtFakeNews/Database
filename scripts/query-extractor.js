const converter = require("json-2-csv");
const Connection = require("../Data");
const TweetModel = require("../Models_new/Tweet/TweetModel");
const QueryService = require("../Services/Query/QueryService");
const fs = require('fs');

Connection.Database.connect().then(async ()=>{
    await fs.promises.writeFile('tweets.json', '[');
    await fs.promises.writeFile('users.json', '[');
    await QueryService.QueryTweetService.stream( process.argv[2], {
        onResult: async t=>{
            let mem = {tweets: new Set(), users: new Set()}
            const tweet = new TweetModel(t);
            await tweet.getRecursive(mem);
            console.log(tweet.tweetID)
            mem.tweets.forEach(async value=>{
                await fs.promises.appendFile('tweets.json', JSON.stringify(value.getJSON()) + ',')
            })
            mem.users.forEach(async value=>{
                await fs.promises.appendFile('users.json', JSON.stringify(value.getJSON()) + ',')
            })
        },
        onEnd: async ()=>{
            await fs.promises.appendFile('tweets.json', ']');
            await fs.promises.appendFile('users.json', ']');
            process.exit();
        }
    })
})