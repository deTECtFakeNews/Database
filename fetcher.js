const { text } = require("express");
const Data = require("./Data");
const QueryModel = require("./Models/QueryModel");

const delay = ms => new Promise(res => setTimeout(res, ms));

let _queries = [
    'Coronavac Sinovac China SER', 
    'covid #FuerzaGatell Gatell', 
    'López Gatell Pronta recuperación recupérese', 
    '#DrMuerte', 
    'Ecatepec vacuna covid', 
    'Viri Ríos vacunas covid', 
    'Xochimilco vacuna covid', 
    'Tláhuac vacuna covid', 
    'Iztacalco vacuna covid', 
    'Laboratorios Liomont AstraZeneca Marcelo Ebrard', 
    'Almirante marina Rafael Ojeda covid', 
    'ONU AMLO vacunas covid', 
    'covax México vacuna Marcelo Ebrard', 
    '#SputnikV vaccination Mexico', 
    '#SputnikVaccinated Mexico', 
    'Johnson & Johnson vacuna FDA', 
    'Ackerman Conacyt pandemia', 
    '800 Sinovac Marcelo Ebrard', 
    'AMLO vacuna covid', 
    'ONU florero acaparamiento vacuna', 
    'Covax ONU vacuna', 
    '800 Marcelo Ebrard Coronavac'
]


Data.SSHDBconnect().then(async()=>{
    Data.Database.connect((err)=>{console.log(err)});
    for(let query of _queries){
        await QueryModel.createNew(query);
    }



    /* QueryModel.read().then(async queries=>{
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
    }) */
})
