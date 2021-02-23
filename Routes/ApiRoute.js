const { json } = require('express');
const express = require('express');
const QueryModel = require('../Models/QueryModel');
var { Parser } = require('json2csv');
const FileService = require('../Services/FileService');
const TweetModel = require('../Models/TweetModel');

const fetch = require('node-fetch');

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
    let expansions = req.query.fields || "";

    await Promise.all( queryIDs.map(async id=>{
        let query = (await QueryModel.read(id))[0];
        let contents = await query.getTweets();
        let query_expanded = query.getData();
        query_expanded.tweets = [];
        await Promise.all( contents.map(async tweet=>{
            let tweetData = await fetch(`http://${req.hostname}:8080/api/tweet/${tweet.tweetID}/?fields=${expansions}`);
            query_expanded.tweets.push( await tweetData.json()[0] )
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

router.get('/tweet/:tweetIDs', async (req, res)=>{
    let tweetIDs = req.params.tweetIDs.split(',');
    let results = [];

    let expansions = req.query.fields?.split(',') || []

    await Promise.all( tweetIDs.map(async id=>{
        let tweet = (await TweetModel.read(id))[0];
        let tweet_expanded = tweet.getData();

        if(expansions.includes('analysis') || expansions.includes('all')){
            await tweet._TweetAnalysis.read();
            tweet_expanded.analysis = tweet._TweetAnalysis.getData()
        } 
        if(expansions.includes('entities') || expansions.includes('all')){
            await tweet._TweetEntities.read();
            tweet_expanded.entities = tweet._TweetEntities.entities;
        }
        if(expansions.includes('stats') || expansions.includes('all')){
            await tweet._TweetStatsFreeze.read();
            tweet_expanded.stats = tweet._TweetStatsFreeze.stats;
        }

        results.push(tweet_expanded)
    }) );
    res.json(results);
});


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