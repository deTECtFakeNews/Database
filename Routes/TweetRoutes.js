const express = require('express');
const TweetModel = require('../Models/TweetModel');
var router = express.Router();

router.use(express.json())

router.get('/', (req, res)=>{
    res.end("Tweet");
})

router.get('/fetch/:id', async (req, res)=>{
    let tweet = await TweetModel.getFromAPI(req.params.id)
    let data = {
        ...tweet.getData(),
        _TweetStatsFreeze: tweet.getStats()
    }
    res.json(data);
})

router.get('/read', async (req, res)=>{
    let tweets = await TweetModel.readFromDatabase(req.query);
    let data = tweets.map( t => ({
        ...t.getData(),
        _TweetStatsFreeze: t.getStats()
    }) )
    res.json(data)
})

router.get('/read/:id', async (req, res)=>{
    let tweet = await TweetModel.readFromDatabase({'Tweet.tweetID': req.params.id});
    let data = {
        ...tweet[0].getData(),
        _TweetStatsFreeze: tweet[0].getStats()
    }
    res.json(data);
})

router.post('/upload', async (req, res)=>{
    try{
        let tweet = new TweetModel(req.query);
        await tweet.insertToDatabase();
        res.end(0);
    } catch (e){
        res.end(e)
    }
})

router.post('/fetchupload/:id', async (req, res)=>{
    try{
        let tweet = await TweetModel.getFromAPI(req.params.id);
        await tweet.insertToDatabase();
        res.end("Sucress");
    } catch (e){
        res.end(e);
    }
})

router.post('/update/:id', async (req, res)=>{
    let tweet = await TweetModel.getFromAPI(req.params.id);
    await tweet._TweetStatsFreeze.updateToDatabase();
    res.end(0)
})

router.get('/embed/:id', async (req, res)=>{
    let tweet = await TweetModel.getFromAPI(req.params.id);
    let data = await tweet.getEmbed();
    console.log(data);
    res.end(data)
})

module.exports = router;