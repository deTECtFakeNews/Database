const Connection = require("../Data");
const { QueryTree, QueryNode } = require("../Models/Query/QueryTree");
const QueryService = require("../Services/Query/QueryService");
const fs = require('fs')
// Create a tree
const tree = new QueryTree();
// Connect to db
Connection.Database.connect().then(()=>{
    QueryService.stream({shouldExecute: 1}, {
        // Create node and add each query
        onResult: ({queryID, query}) => {
            tree.addNode( new QueryNode({queryID, query}) ) 
        }, 
        onEnd: async()=>{
            // Build the tree with all the data
            await tree.buildTree();
            // Save to file
            await fs.promises.writeFile('tree.json', JSON.stringify(tree.getTree()), 'utf8');
            process.exit(0);
        }
    })
})