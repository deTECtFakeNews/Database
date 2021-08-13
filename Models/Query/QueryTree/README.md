Models/Query
---------------------
# QueryTree

## About
Lorem ipsum dolor

## `QueryNode`
The class `QueryNode` is used as the building block for creating trees and relationships among queries. 

### `QueryNode.fromJSON(json : Object) : QueryNode`
Transforms a JSON structure into a `QueryNode` object. Applies recurively to its children too. This is very useful when importing data from a document. 

### `queryID : Number`
Same as in Database. Unique identifier for each query. 

### `query : String`
The actual query expression to be evaluated. FOllows twitter Query structure. 

### `depth : Number`
Maximum number of ancestors.

### `weight : Number`
A weight can be assigned accordinnnnng to different criteria. Useful for sorting children. 
> Currently the weight is given by the count result of each query. 

### `children[] : Array<QueryNode>`
Array of descendants. 
It is important to know that all children have depth of `this.depth+1`, and that a node cannot contain itself. 

### `push(node : QueryNode) : void`
Pushes a node into the children and updates its depth to be `this.depth+1`.
> Nodes with depth greater than `this.depth` are NOT inserted as it is assumed they already have a parent. 

### `cleanChildren() : void`
After all nodes have been traversed, this filters children so that their depth equals `this.depth+1` and sorts them by weight.

### `setDepth(n : Number) : Number`
Updates depth to match `n`. Recursively applied to children to match `n+1`.

## `QueryTree`
The class `QueryTree` handles the relationships of the nodes and is tasked with building trees.

### `#data : Object.<String, QueryNode>`
**This is a private property.**
Contains all the `QueryNode` nodes stored as key and value, where the key is the queryID. This data structure allows for O(1) performance when searching for a particular node. 

### `addNode(node : QueryNode) : void`
Adds a node to the data. 

### `async buildTree() : Promise`
Iterates through each node to fetch its weight and children. Children mathces are fetched from a [twitter account](https://twitter.com/ItesmN) and pushed to each node's children. Afterwards, nodes are iterated and the method `cleanChildren()` is called. 

### `getTree() : Array<QueryNode>`
Returns an array of all roots, sorted by weight. 

### `fromJSON(json : Array<Object>) : Array<QueryNode>`
IMmorts an array of JSON structures into data. Each json strucutre is converted into `QueryNode` using the `QueryNode.fromJSON()` method.