const fs = require('fs');
const QueryService = require('../../Services/Query/QueryService');

class QueryNode {
    /**
     * Recursively transforms a json structure into a QueryNode structure
     * @param {Object} json Json data to transform
     * @returns {QueryNode}
     */
    static fromJSON(json){
        let node = new QueryNode({queryID: json.queryID, query: json.query});
        node.depth = json.depth;
        node.weight = json.weight;
        node.children = json.children.map(node => QueryNode.fromJSON(node));
        node.queryWithFilters = json.queryWithFilters;
        return node;
    }
    /**@type {Number} Unique identifier*/
    queryID;
    /**@type {String} Query expression*/
    query;
    /**@type {String} Query with filters*/
    queryWithFilters;
    /**@type {Number} Depth of this node relative to its parents*/
    depth;
    /**@type {Number} Assigned weight for sorting*/
    weight = 0;
    /**@type {Array<QueryNode>} All direct descendants*/
    children=[];
    /**
     * Creates a query node for use in trees
     * @param {{queryID: Number, query: String}} param0 Data
     */
    constructor({queryID, query}){
        this.queryID = queryID;
        this.query = query;
        this.depth = 0;
    }
    /**
     * Pushes a node reference into children
     * @param {QueryNode} node Node to be pushed to children
     * @returns {void}
     */
    push(node){
        if(node.queryID == this.queryID) return;
        if(node.depth > this.depth) return;
        this.children.push(node);
        node.setDepth(this.depth+1)
    }
    /**
     * FIlters children that already have another ancestor. Orders children by weight
     */
    cleanChildren(){
        this.children = this.children
            .filter(node => node.depth == this.depth+1)
            .sort((a, b) => a.weight - b.weight);
        this.children.forEach( node => {node.cleanChildren()} );
        this.queryWithFilters = this.query + this.children.map(node => ` -(${node.query})`).join('')
    }
    /**
     * Updates depth of node, and children recursively
     * @param {Number} n Depth to update
     * @returns {Number}
     */
    setDepth(n){
        this.depth = n;
        this.children.forEach(node => {
            node.setDepth(n+1);
        });
        return this.depth;
    }
    async onPostOrderTraverse(callback){
        // FIrst traverse children (recursively)
        for(let node of this.children){
            await node.onPostOrderTraverse(callback);
        }
        // Call callback on self
        return await callback(this);
    }
}

class QueryTree {
    /**@type {Object.<string, QueryNode>} Private object containing all the info*/
    #data = {}
    constructor(){
        
    }
    /**
     * Adds a new node to data
     * @param {QueryNode} node Node to be added to data
     */
    addNode(node){
        this.#data[node.queryID] = node;
    }
    /**
     * Iterates aech node to fetch weight, children and build tree
     * @returns {Promise}
     */
    async buildTree(){
        for(let node of Object.values(this.#data)){
            try{
                // For each node...
                // Fetch number of tweets
                let count = await QueryService.fetchAPI_historic_count(node.query);
                node.weight = count.meta.total_tweet_count;
                // Get matches
                let {tweets} = await QueryService.fetchAPI(`${node.query} from:ItesmN`);
                for(let {fullText} of tweets){
                    // Extract id and content from text
                    const queryID = fullText.match(/(?<=\(query )\d+(?=\))/gi)[0];
                    const query = fullText.replace(/\(query \d+\) */gi, '');
                    // if node does not exist create a new one
                    if(this.#data[queryID] == undefined) this.#data[queryID] = new QueryNode({queryID, query});
                    // Push to node's children
                    node.push(this.#data[queryID]);
                }
            } catch(e){
                console.error(e);
            }
            console.log(node.query)
        }
        // Clean each noode's children
        for(let node of Object.values(this.#data)){
            node.cleanChildren();
        }
    }
    /**
     * Returns array of roots from data
     * @returns {Array<QueryNode>}
     */
    getTree(){
        return Object.values(this.#data)
            .filter(node => node.depth == 0)
            .sort((a,b) => a.weight - b.weight )
    }
    fromJSON(json){
        this.#data = json?.map(node => QueryNode.fromJSON(node));
        return this.getTree();
    }
    async onPostOrderTraverse(callback){
        for(let node of this.getTree()){
            await node.onPostOrderTraverse(callback);
        }
    }
}

module.exports = {QueryNode, QueryTree}
