const { QueryTree } = require("../Models_new/Query/QueryTree");
const fs = require('fs');
const Connection = require("../Data");
const QueryService = require("../Services/Query/QueryService");
const QueryModel = require("../Models_new/Query/QueryModel");

// Create empty tree
const tree = new QueryTree();
// Load tree file
fs.readFile('tree.json', {encoding: 'utf8'}, async (error, data) => {
    await Connection.Database.connect();
    tree.fromJSON(JSON.parse(data));
    await tree.onPostOrderTraverse(async node => {
        // Get full from database
        const [q] = await QueryService.read(node.queryID);
        const query = new QueryModel(q);
        // Copy tweets from children
        if(node.children.length>0){
            for(let child of node.children){
                try{
                    await QueryService.QueryTweetService.copy(child.id, node.id);
                } catch(e){
                    console.log("Errror copying tweets from children")
                }
            }
        }
        // Execute
        try{
            console.log('===============================================')
            console.log('===============================================')
            console.log('===============================================')
            console.log(query.query);
            if(query.shouldExecute) await query.executeHistoric();
        } catch(e){
            console.log("An error ocurred executing query", query.query)
        }
    })
})