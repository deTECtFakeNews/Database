const Connection = require("./Data");
const QueryModel = require("./Models/Query/QueryModel");
const {Node, NodePool} = require("./Models/Query/QueryTreeModel");
const QueryService = require("./Services/Query/QueryService");

Connection.connect().then(()=>{
    // executeAll();

    QueryService.read().then(data=>{
        let queries = {};
        let pool = new NodePool();
        data.forEach(async query => {
            // Create node
            let queryNode = new Node({ content: query.query, regex:  query.regex });
            queryNode.id = query.queryID;
            pool.push(queryNode);
            // Create querymodel
            let queryModel = new QueryModel(query);
            queries[query.queryID] = queryModel;

        });
        pool.getTree()

        pool.postOrderTraversal(async node => {
            // console.log("Executing query", node.id, "in PST")
            // Get query
            let query = queries[node.id];
            // If has children
            if(node.children.length > 0){
                for(let child of node.children){
                    try{
                        await QueryService.QueryTweetService.copy(child.id, node.id);
                        console.log('\​u0007')
                    } catch(e){

                    }
                }
            }
            if(node.filter.length > 0){
                // Get filtered from node
                let filtered = node.filter.flat(10).join(' OR ');
                // Modify query to exclude
                query.query += ` -(${filtered})`;
            }
            try{
                if(!query.shouldExecute) return;
                console.log(query.query)
                await query.executeAll();
            } catch(e){
                console.log(`An error ocurred executing query ${query.query}`)
                console.error(e)
            }
        })

    })
})
