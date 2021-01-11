# Services Layer
The Data Layer handles the connections to both the database and Twitter API. 
The Services layer allows to perform basic read and write operations using both, in a way that guarantees the integrity of information and easy scalability. This layer has the purpose to:
- Define a consistent data structure for the Twitter API, the database and the system
- Execute basic Create, Read, Update and Delete queries with all the necessary filters
- Communicate with other services (Internal and External)

# About
As with the Data Layer, the information is categorized into *Tweet*, *User* and *Query*. For extendibility, a *Analysis* service is provided as well. 
Each category is exported in its own file as an object with the service suffix. 

# User Services
Contains methods to fetch from API, data normalization and CRUD operations for Users and related entities. 

## `UserService.normalize()`
**Returns: `UserServiceObject`**. Receives data from Twitter API and returns a normalized object with the same nomenclature as the database and the rest of the system. 

## `UserService._createTable()`
**Returns: `Promise`**. For backup, contains SQL script to create the table User in the db.

## `UserService.insertToDatabase(UserServiceObject user)`
**Returns: `Promise`**. Inserts data from `user` into the User table. 

## `UserService.readFromDatabase(Object query_params)`
**Returns: `Promise<Array<UserServiceObject>>`**. Selects records from User table given the parameters.

## `UserService.updateToDatabase(Number id, UserServiceObject user)`
**Returns: `Promise`**. Updates User with given id with the data from `user`.

## `UserService.deleteFromDatabase(Number id, UserServiceObject)`
**Returns: `Promise`**. Deletes the user. 
> TODO: needs implementation

## `UserService.getFromAPI(Number id)`
**Returns `Promise<UserServiceObject>`**. Uses Twitter API to fetch a specific user. 