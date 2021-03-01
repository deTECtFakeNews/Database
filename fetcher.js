const { text } = require("express");
const Data = require("./Data");
const QueryModel = require("./Models/QueryModel");

const delay = ms => new Promise(res => setTimeout(res, ms));


Data.SSHDBconnect().then(async()=>{
    Data.Database.connect((err)=>{console.log(err)});
    QueryModel.read().then(async queries=>{
        while(true){
            for(let query of queries){
                console.log(query.query);
                if(query.shouldExecute){
                    let results = await query.execute();
                    for(let tweet of results){
                        console.log(query.queryID, tweet.tweetID)
                    }
                    await delay(1*60*1000);
                }
            }
        }
    })
})
