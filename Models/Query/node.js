class Node {
    static counter = 0;
    id;
    content;
    regex;
    children = [];
    depth = 0;
    constructor({content, regex}){
        this.content = content;
        this.regex = new RegExp(regex, 'im');
        this.id = Node.counter++;
        this.children = [];
    }
    getRegexFromContent(){
        // Remova ll parenthesis and ors (to be replaced with ands)
        let filtered = this.content.replace(/\(|\)|(\bOR\v)/gmi, '');
    }
    push(/**@type {Node}*/ node) {
        // Avoid adding circular reference
        if(this.id == node.id) return false;
        // Avoid adding duplicates
        if(this.children.some( child => child.id == node.id )) return false;
        // Add only when regex matches
        if(!this.regex.test(node.content)) return false;
        // Call recursively to see if it can be passed to children
        let canBePassedToChildren = this.children.some(child => {child.push(node)})
        // If can't be passed to children, add new
        if(!canBePassedToChildren){
            this.children.push(node);
            node.depth=this.depth+1;
        }
        // Return true
        return true;
    }

    removeUndirectChildren(){
        // this.children = this.children.filter(node => node.depth == this.depth+1)
    }
}

class NodePool {
    /**@type {Array<Node>} */
    data = [];
    constructor(){

    }

    push(/**@type {Node}*/ node){
        this.data.push(node);
    }

    getTree(){
        // Addd all nodes together
        this.data.forEach(node => {
            this.data.forEach(nnode => {
                node.push(nnode)
            })
        })
        // Remove duplicates
        this.data.forEach(node => {node.removeUndirectChildren()})
        // return
        return this.data
            .filter(node => node.depth == 0)
    }

}

function getRegex(query){

}

/* 
let nodes = [
    new Node({content: 'A OR B', regex: '(?=.*(A)\\b)(?=.*(B)\\b)'}), 
    new Node({content: 'A', regex: '(?=.*(A)\\b)'}),
    new Node({content: 'B', regex: '(?=.*(B)\\b)'})
]

let pool = new NodePool();
nodes.forEach(pool.push.bind(pool));
// pool.getTree();

console.log(JSON.stringify(pool.getTree(), '', 2))

 */
module.exports = Node;