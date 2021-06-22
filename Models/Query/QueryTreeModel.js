
class Node {
    /**@type {Number} Counts the number of instances */
    static counter = 0;
    /**@type {String} Content of node*/
    content;
    /**@type {RegExp} Regex for comparissons*/
    regex;
    /**@type {Number} Maximum depth. Useful for trees*/
    depth;
    /**@type {Array<Node>} Array of children*/
    children = [];
    /**@type {Array<String>} Exclusion of elements present in children*/
    filter = [];
    constructor({content, regex = content} = {}) {
        this.content = content;
        this.regex = new RegExp(regex, 'gim');
        // Init default
        this.depth = 0;
        this.children = [];
        this.filter = [];
        // Increment counter by one and add
        this.id = Node.counter++;

        this._descendants = 0;
    }
    /**
     * Push a new node into itself if condition is met
     * @param {Node} node Node to be pushed
     */
    push(node){
        if(
            // Avoid pushing node into itself
            this.id != node.id &&
            // Test with regex to see if matches
            this.regex.test(node.content)
        ) {
            // Add to children and increase depth
            this.children.push(node);
            node.depth = this.depth + 1;
        }
    }
    /**
     * Removes children with depth greater than node.depth + 1
     */
    removeUndirectChildren(){
        this.children = this.children.filter(node => node.depth == this.depth+1)
    }
    /**
     * Returns difference in content keywords
     */
    getFilter(){
        this.children.forEach(node => {
            // If node contains children (and therefore filter) add them to parent
            // Condition is not set to existance of filter, as such can change with time
            if(node.children.length > 0) this.filter.push( node.filter );
            // Regex that returns parent words as or statement
            let parentWords = new RegExp(`(${ this.content.replace(/\s+/gmi, '|') })( *)`, 'gmi');
            // Delete parent words to get difference
            let childUniqueWords = node.content.replace(parentWords, '');
            // Add to array 
            this.filter.push(childUniqueWords);
        })
    }

    countDescendants(){
        if(this.children.length == 0){
            this._descendants = 1;
        } else {
            this.children.forEach(node => {
                this._descendants += node.countDescendants();
            });
        }
        return this._descendants;
    }

    async postOrderTraversal(callback){
        for(let node of this.children){
            await node.postOrderTraversal(callback);
        }
        return await callback(this)
    }

}

class NodePool {
    /**@type {Array<Node>} */
    data = [];
    /**@type {Array<Node>} */
    tree = [];
    _isTreeComplete;
    constructor(){
        this._hasRelationship = false;
    }
    /**
     * Adds a new node to data
     * @param {Node} node Node to be added to data
     */
    push(node){
        this.data.push(node);
        this._isTreeComplete = false;
    }
    getTree(){
        if(this._isTreeComplete) return;
        // Reset values to default
        this.reset();
        // First see which nodes are descendents (not necessarily children) of which
        this.data.forEach(node => {
            this.data.forEach(nestedNode => {
                node.push(nestedNode);
            })
        })
        // Then, delete duplicates or undirect children
        this.data.forEach(node => {
            node.removeUndirectChildren();
        })
        // Then, having the children, get filter keywords
        this.data.forEach(node => {
            node.getFilter();
            node.countDescendants();
        });
        // Save tree
        this.tree = this.data
            .filter( item => item.depth == 0 ) // Get array of roots
            .sort((a, b) => b._descendants - a._descendants) // Sort by amount of children
        // Return tree
        return this.tree
    }
    reset(){
        this.data.forEach(node => {
            node.depth = 0;
            node.children = [];
            node.filter = [];
        })
    }

    async postOrderTraversal(callback){
        for(let node of this.tree.reverse()){
            await node.postOrderTraversal(callback)
        }
    }

}

module.exports = {Node, NodePool}