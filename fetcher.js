const Connection = require("./Data");
const QueryModel = require("./Models/Query/QueryModel");
const {Node, NodePool} = require("./Models/Query/QueryTreeModel");
const QueryService = require("./Services/Query/QueryService");
/* function executeAllQueries(){
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
}) */

function executeAll(){
    QueryService.stream(undefined, {
        onResult: async q => {
            try{
                const query = new QueryModel(q);
                if(!query.shouldExecute) return;
                await query.executeAll();
            } catch(e){
                console.log(`An error ocurred executing query ${q.query}`)
                console.error(e)
            }
        }, 
        onEnd: executeAll
    })
}

Connection.connect().then(()=>{
    // executeAll();

    QueryService.read().then(data=>{
        let queries = {};
        let pool = new NodePool();
        data.forEach(query => {
            // Create node
            let queryNode = new Node({ content: query.query, regex:  query.query.replace(/(([A-zÀ-ú]|\d|#|&)+)( *)/img, "(?=.*($1)\\b)")});
            queryNode.id = query.queryID;
            pool.push(queryNode);
            // Create querymodel
            let queryModel = new QueryModel(query);
            queries[query.queryID] = queryModel;
        });
        pool.getTree()

        pool.postOrderTraversal(async node => {
            console.log("Executing query", node.id, "in PST")
            // Get query
            let query = queries[node.id];
            // If has children
            if(node.children.length > 0){
                
            }
            if(node.filter.length > 0){
                // Get filtered from node
                let filtered = node.filter.flat(10).join(' OR ');
                // Modify query to exclude
                query.query += ` -(${filtered})`;
            }
            try{
                if(!query.shouldExecute) return;
                await query.executeAll()
            } catch(e){
                console.log(`An error ocurred executing query ${query.query}`)
                console.error(e)
            }
        })

    })
})




/* console.log(JSON.stringify(
    QueryService.getRelationships()
    .sort((a, b) => a.importFrom.length - b.importFrom.length)
)); */

/* Connection.connect().then(()=>{
    QueryService.read().then(data => {
        let all = data.map( query => ({
            queryID: query.queryID, 
            query: query.query, 
            regex: query.query.replace(/(([A-zÀ-ú]|\d|#|&)+)( *)/img, "(?=.*($1)\\b)")
        }))
        console.log(JSON.stringify(all))
/* 
        let all = data.map( query => 
            new Node({
                content: query.query, 
                regex: query.query.replace(/(([A-zÀ-ú]|\d|#|&)+)( *)/img, "(?=.*($1)\\b)")
            })
        )
        all.forEach(node => {
            all.forEach(nextedNode => {
                nextedNode.push(nextedNode)
            })
        })
        all.forEach(node => {
            node.purge();
            if(node.depth == 0) console.log(node)
        }) 
    })
}) */