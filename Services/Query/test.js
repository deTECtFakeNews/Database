const Connection = require("../../Data");
const QueryService = require("./QueryService");

Connection.Database.connect().then(async()=>{
    QueryService.stream(undefined, {
        onResult: async q=>{
            // console.log(q);
            await QueryService.fetchAPI_historic(q.query, {}, {
                onResult: tweet => {
                    console.log(tweet)
                }, 
                onError: console.error
            })
        }
    })
})