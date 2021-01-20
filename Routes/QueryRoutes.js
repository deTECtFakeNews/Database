const { json } = require('express');
const express = require('express');
const QueryModel = require('../Models/QueryModel');
var router = express.Router();

router.use(express.json());

router.get('/', (req, res)=>{
    res.end("Query")
});
// localhost::8080/Query/new?q=Coronavirus
router.get('/new', async (req, res)=>{
    if(req.query.q.length <= 0) res.end();
    let data = await QueryModel.createNew(req.query.q);
    res.json(data.getResultsData())
})

module.exports = router; 