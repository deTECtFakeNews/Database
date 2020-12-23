const express = require('express');
const QueryModel = require('../Models/QueryModel');
var router = express.Router();

router.use(express.json());

router.get('/', (req, res)=>{
    res.end("Query")
});

router.get('/fetch', async (req, res)=>{
    if(req.query.q.length <= 0) res.end();
    let query = await QueryModel.getFromAPI(req.query.q);
    res.json(query.getData());
})

module.exports = router; 