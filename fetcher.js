const Connection = require("./Data");
const QueryModel = require("./Models/Query/QueryModel");
const QueryService = require("./Services/Query/QueryService");

function executeAllQueries(){
    QueryService.stream(undefined, {
        onResult: async q => {
            try{
                let query = new QueryModel(q);
                if(!query.shouldExecute) return;
                await query.execute();
                console.log(`Executed query ${query.query}. Fetched ${query.savedTweets.length} tweets`)
            } catch(e){
                console.log(`An error ocurred executing query ${q.query}`)
                console.error(e)
            }
        },
        onEnd: executeAllQueries
    })
}


Connection.connect().then(()=>{
    executeAllQueries();
})