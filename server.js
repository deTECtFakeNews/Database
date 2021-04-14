const TweetModel = require("./Models/TweetModel");
const UserModel = require("./Models/UserModel");
const TweetRouter = require('./Routes/TweetRoutes');
const UserRouter = require('./Routes/UserRoutes');
const QueryRoutes = require('./Routes/QueryRoutes');
const ApiRouter = require('./Routes/ApiRoute')
const express = require('express');
const Data = require("./Data");
const QueryModel = require("./Models/QueryModel");
const { response } = require("express");
var app = express(); 

const PORT = process.env.PORT || 8080;


Data.SSHDBconnect().then(async ()=>{

    


    app.use('/tweet', TweetRouter);
    app.use('/user', UserRouter);
    app.use('/query', QueryRoutes);


    app.use('/api', ApiRouter)

    app.use(express.static(__dirname+'/Public'));
    app.listen(PORT, ()=>{
        console.log("App listening on port" + PORT);
    })

})

