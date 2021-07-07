const { connect } = require("../Data");
const fs = require('fs');
const { QueryTree, QueryNode } = require("../Models/Query/QueryTree/QueryTree");
const QueryService = require("../Services/Query/QueryService");
const QueryModel = require('../Models/Query/QueryModel');

// Create an empty tree
const tree = new QueryTree();
// Load tree file
fs.readFile('tree.json', {encoding: 'utf8'}, async (error, data) => {
    await connect();
    tree.fromJSON(JSON.parse(data));
    await tree.onPostOrderTraverse(async node=>{
        // Load node from database
        let q = await QueryService.read(node.queryID);
        let query = new QueryModel(q[0])
        // Copy tweets from children
        if(node.children.length>0){
            for(let child of node.children){
                try{
                    await QueryService.QueryTweetService.copy(child.id, node.id);
                } catch(e){}
            }
        }
        // Execute
        try{
            console.log(query.query);
            if(query.shouldExecute) await query.executeAll();
        } catch(e){
            console.log("An error ocurred executing query ", query.query);
            console.error(e)
        }
    })
})