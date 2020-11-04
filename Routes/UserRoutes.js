const express = require('express');
const UserModel = require('../Models/UserModel');

var router = express.Router();
router.use(express.json());

router.get('/', (req, res)=>{
    res.end("User");
})

router.get('/fetch/:id', async (req, res)=>{
    let user = await UserModel.getFromAPI(req.params.id);
    let data = {
        ...user.getData(),
        _UserStatsFreeze: user.getStats()
    }
    res.json(data);
})

router.get('/read', async (req, res)=>{
    let users = await UserModel.readFromDatabase(req.query);
    let data = users.map( u => ({ 
        ...u.getData(),
        _UserStatsFreeze: u.getStats()
    }) )
    res.json(data);
})

router.get('/read/:id', async (req, res)=>{
    let user = await UserModel.readFromDatabase({'User.userID': req.params.id});
    let data = {
        ...user[0].getData(),
        _UserStatsFreeze: user[0].getStats()
    }
    res.json(data);
})

router.post('/upload', async (req, res)=>{
    try {
        let user = new UserModel(req.query);
        await user.insertToDatabase();
        res.end(0);
    } catch (e) {
        res.end(e);
    }
})

router.post('/update/:id', async (req, res)=>{
    let user = await UserModel.getFromAPI(req.params.id);
    return await user._UserStatsFreeze.updateToDatabase();
})

module.exports = router;