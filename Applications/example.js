/**
 * @author Eduardo Villalpando Mello
 * @version 1.0.0
 * tweet-delete
 * This tool removes specific tweets from the project DB
 */
const SystemService = require("../Services/System/SystemService");
const Connection = require("../Data");
// const TweetModel = require("../Models/Tweet/TweetModel");
// const TweetService = require("../Services/Tweet/TweetService");

console.log(`tweet-delete v.1.0.0
This tool removes specific tweets from the project DB
Type the tweetID below. `)

async function someFun(){
    let i = '  ';
    while(i != '-1'){
        i = await SystemService.input('TweetID');
        console.log(`${i}!`)
    }
    process.exit(0)
}

someFun()