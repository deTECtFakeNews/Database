const { json } = require('express');
const express = require('express');
const QueryModel = require('../Models/QueryModel');
var { Parser } = require('json2csv');
const FileService = require('../Services/FileService');
const TweetModel = require('../Models/TweetModel');

var router = express.Router();

router.use(express.json());

router.get('/', (req, res)=>{
    res.end("API ENDPOINT")
});

router.get('/query', async (req, res)=>{
    let queries = (await QueryModel.read()).map(q=>q.getData());
    res.json(queries);
})

router.get('/query/:queryIDs', async (req, res)=>{
    let queryIDs = req.params.queryIDs.split(',');
    let results = [];
    await Promise.all(queryIDs.map( async id=>{
        let query = (await QueryModel.read(id))[0];
        results.push(query.getData());
    } ));
    res.json(results)
})

router.get('/query/:queryIDs/tweets', async (req, res)=>{
    let queryIDs = req.params.queryIDs.split(',');
    let results = [];

    await Promise.all( queryIDs.map(async id=>{
        let query = (await QueryModel.read(id))[0];
        let contents = await query.getTweets();
        let query_expanded = query.getData();
        query_expanded.tweets = [];
        await Promise.all( contents.map(async tweet=>{
            await tweet._TweetStatsFreeze.read();
            let author = await tweet.getAuthor();
            let retweets = tweet._TweetStatsFreeze.getMax('retweetCount');
            let favorites = tweet._TweetStatsFreeze.getMax('favoriteCount');
            query_expanded.tweets.push({
                tweetID: tweet.tweetID.toString(), 
                queryID: query.queryID, 
                query: query,
                authorID: tweet.authorID.toString(), 
                authorScreenName: author.screenName,
                creationDate: tweet.creationDate,
                fullText: tweet.fullText, 
                retweets, favorites
            })
        }) );
        results.push(query_expanded)
    }) )
    res.json(results);
})

router.get('/query/:queryIDs/entities', async (req, res)=>{
    let queryIDs = req.params.queryIDs.split(',');
    let results = [];
    await Promise.all( queryIDs.map(async id=>{
        let query = (await QueryModel.read(id))[0];
        let tweets = await query.getTweets();
        let {entities, entitiesStats} = await query.getEntities();
        let query_expanded = query.getData();
        query_expanded.entities = entities;
        query_expanded.entitiesStats = entitiesStats;
        results.push(query_expanded)
    }) );
    res.json(results)
    console.log("done")
})



router.post('/tweet/:tweetID/analysis', async (req, res)=>{
    let params = req.params;
    let analysis = new TweetModel.TweetAnalysis({
        tweetID: req.query.tweetID,
        ...params
    });
    res.json(analysis.getData())
    /* try{
        await analysis.insertToDatabase();
        res.status(200)
    } catch(e) {
        res.status(500)
    } */
})

module.exports = router;