const { json } = require('express');
const express = require('express');
const QueryModel = require('../Models/QueryModel');
var { Parser } = require('json2csv');
const FileService = require('../Services/FileService');

var router = express.Router();

router.use(express.json());

router.get('/', (req, res)=>{
    res.end("API ENDPOINT")
});



router.get('/query/:queryIDs/tweets', async (req, res)=>{
    let queryIDs = req.params.queryIDs.split(',');
    let results = [];

    await Promise.all( queryIDs.map(async id=>{
        let query = (await QueryModel.read(id))[0];
        let contents = await query.getTweets();
        await Promise.all( contents.map(async tweet=>{
            await tweet._TweetStatsFreeze.read();
            let author = await tweet.getAuthor();
            let retweets = tweet._TweetStatsFreeze.getMax('retweetCount');
            let favorites = tweet._TweetStatsFreeze.getMax('favoriteCount');
            results.push({
                tweetID: tweet.tweetID.toString(), 
                queryID: query.queryID, 
                authorID: tweet.authorID.toString(), 
                authorScreenName: author.screenName,
                creationDate: tweet.creationDate,
                fullText: tweet.fullText, 
                retweets, favorites
            })
        }) )

    }) )


    if(req.query.format == 'csv'){
        let csv = await FileService.createCSV(results);
        // res.end(csv)
        // let csv = new Parser().parse(results);
        res.attachment('queries.csv');
        res.status(200).send(csv);
    } else {
        res.json(results)
    }
})


module.exports = router;