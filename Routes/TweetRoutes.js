const express = require('express');
const TweetModel = require('../Models/TweetModel');
const os = require('os')
var router = express.Router();

router.use(express.json())

router.get('/', (req, res)=>{
    res.end("Tweet");
})

router.get('/fetch/:id', async (req, res)=>{
    let tweet = await TweetModel.getFromAPI(req.params.id)
    let data = {
        ...tweet.getData(),
        _TweetStatsFreeze: tweet.getStats(),
    }
    res.json(data);
})

router.get('/read', async (req, res)=>{
    let tweets = await TweetModel.read(req.query);
    let data = await Promise.all(tweets.map(async (t,i)=>({
        ...t.getData(),
        urlToDetails: req.protocol + '://' + req.get('host') + '/Tweet/read/' + t.tweetID 
    })))
    res.json(data)
})

router.get('/read/:id', async (req, res)=>{
    let tweet = await TweetModel.read(req.params.id);
    if(tweet == undefined) {
        res.status(404);
        return;
    }
    // Read stats
    let stats = await tweet[0]._TweetStatsFreeze.read();
    let user = await (await tweet[0].getAuthor()).getData();
    let translation = await tweet[0]._TweetAnalysis.execute('translation');
    let retweets = await tweet[0].getRetweets()

    let data = {
        ...tweet[0].getData(), 
        translation: translation, 
        retweets: retweets,
        _TweetStatsFreeze: stats,
        _User: user
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