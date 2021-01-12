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

## `UserService.normalize(data)`
- Returns: `UserServiceObject` 
- Parameters:
    - UserService_Data **data** Data object as received by Twitter API

Internal - Receives data from  Twitter object and returns in normalized form with the same nomenclature as database.

## `UserService.createTable()`
- Returns: `Promise`

Database - Creates Table User in Database. (For backup and maintenance)

## `UserService.create(user)`
- Returns `Promise`
- Parameters:
    - UserService_Data **user** User data in normalized form to be added into new row

Database - Creates (inserts into new row) new User in table

## `UserService.read(query_params)`
- Returns: `Promise<Array<UserService_Data>>`
- Parameters:
    - Object|Number|String **query_params** Parameters to execute query | Id of row to read

Database - Read User row(s) from table

## `UserService.update(id, user)`
- Returns: `Promise`
- Parameters:
    - Number|String **id** Id of row to be updated with data
    - UserService_Data **user** Data of the user to be updated

Database - Update User row with new data 

## `UserService.delete(id)`
- Returns: `Promise`
- Parameters:
    - Number|String **id** Id of the user to be deleted

Database - Delete User row

## `UserService.fetchAPI(id)`
- Returns: `Promise<UserService_Data>`
- Parameters:
    - Number|String **id** Id of user to be fetched

Twitter API - Fetch 

## `UserService.UserStatsFreeze`
Interface with services for UserStatsFreeze table in database. 

### `UserService.UserStatsFreeze.createTable()`
- Returns: `Promise`

Database - Create table

### `UserService.UserStatsFreeze.create(userStats)`
- Returns: `Promise`
- Parameters:
    - UserService_StatsFreeze_Data **userStats** User statistics to be inserted

Database - Creates (inserts into new row) new UserStatsFreeze to table

### `UserService.UserStatsFreeze.read(query_params)`
- Returns: `Promise`
- Parameters:
    - Object|Number|String **query_params** Parameters to execute query | Id of User

Database - Read UserStatsFreeze row(s) from table

### `UserService.UserStatsFreeze.update(id, userStats)`
- Returns: `Promise`
- Parameters: 
    - Number|String **id** Id of row to be updated with data
    - UserService_StatsFreeze_Data **user** Data to be updated

Database - Update UserStatsFreeze row with new data 

## `UserService.UserAnalysis`
Interface with services for UserAnalysis table in database. 

> Needs implementation

# Tweet Services
Contains methods to fetch from API, data normalization and CRUD operations for Tweets and related entities. 

## `TweetService.normalize(data)`
- Returns: `TweetService_Data` 
- Parameters:
    - UserService_Data **data** Data object as received by Twitter API

Internal - Receives data from  Twitter object and returns in normalized form with the same nomenclature as database.

## `TweetService.createTable()`
- Returns: `Promise`

Database - Creates Table Tweet in Database. (For backup and maintenance)

## `TweetService.create(tweet)`
- Returns `Promise`
- Parameters:
    - TweetService_Data **tweet** Tweet data in normalized form to be added into new row

Database - Creates (inserts into new row) new Tweet in table

## `TweetService.read(query_params)`
- Returns: `Promise<Array<TweetService_Data>>`
- Parameters:
    - Object|Number|String **query_params** Parameters to execute query | Id of row to read

Database - Read Tweet row(s) from table

## `TweetService.update(id, tweet)`
- Returns: `Promise`
- Parameters:
    - Number|String **id** Id of row to be updated with data
    - TweetService_Data **tweet** Data of the tweet to be updated

Database - Update Tweet row with new data 

## `UserService.delete(id)`
- Returns: `Promise`
- Parameters:
    - Number|String **id** Id of the user to be deleted

Database - Delete User row