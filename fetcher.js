const { text } = require("express");
const Data = require("./Data");
const QueryModel = require("./Models/QueryModel");
const GoogleDriveService = require("./Services/GoogleDriveService");
const delay = ms => new Promise(res => setTimeout(res, ms));


Data.SSHDBconnect().then(async()=>{
    Data.Database.connect((err)=>{console.log(err)});
    while(true){
        let newQueries = await GoogleDriveService.readSpreadsheet('1Hpb_UJ_VBHktK18qrxoYKUwMrRFbd6VECgIO52XlrAI', 1)
    
        newQueries.entries.forEach(async element => {
            await QueryModel.createNew(element.query)
        });
    
        QueryModel.read().then(async queries=>{
            while(true){
                let now = new Date();
                if(now.getDay()==1 && now.getHours()==13 && now.getMinutes()==0) break;
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
    }
})
