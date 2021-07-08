Services
----------
# User Services

User services provides abstraction and encapsulation for all operations on the Database and Twitter API requests concerning Twitter User data. This includes information about followers and user statistics. 

## JSON Structures
The following structures exist to maintain homogeneity of data between the Database and Twitter API v1 and v2. These are used across the entire proyect and should be validated thoroughly. 

### UserJSON
| **Property** | Type | Description  |
| ------------ | ---- | ------------ |
| userID | String | Unique identifier for user in Twitter and Database |
| creationDate | Date | Date and time of account creation |
| fullName | String | Full name of user account |
| screenName | String | Twitter username of handle (e.g., \@edvilme). It is unique but can change in the future |
| biography | String | Profile description set by user. Can contain entities |
| isProtected | Boolean | Is account protected/private? This means only accepted followers can view their tweets
| isVerified | Boolean | Is account's identity verified by Twitter? Verification is often given to influential people
| language | String | User's langauge preference. (**Important: This feature no longer exists with API v2**) |
| placeDescription | String | Place selected by user to be displayed on their profile |
| latestStats | UserStatsJSON | Latest statistical data

### UserStatsJSON
| **Property** | Type | Description |
| ------------ | ---- | ----------- |
| userID | String | Unique identifier for user in Twitter and Database |
| followersCount | Number | Number of accounts following this user |
| followingCount | Number | Number of accounts this user follows |
| listedCount | Number | Number of lists this user appears in |
| favoritesCount | Number | Number of tweets this user has liked in its lifetime. (**Important: This feature no longer exists with API v2**) |
| statusesCount | Number | Number of tweets (including quote tweets and replies) this user has posted |
| updateDate | Date | Date in which stats were received. This should default to the current date when fetching from API |
| status | String | (Optional) Status of the account. i.e., active, suspended or removed

## Methods

### *Global User Services*

### `normalize(data : Object) : UserJSON`
This method transforms JSON User data returned from Twitter API v1.1 and transforms it to `UserJSON` for use within the system.

### `normalize_v2(data : Object) : UserJSON`
This method transforms JSON User data returned from Twitter API v2 and transforms it to `UserJSON` for use within the system. 

### `fetchAPI(userID : String) : Promise<UserJSON>`
Calls endpoint `1.1/users/show` on the [Twitter pool](../../Data/twitter.md) to fetch user data from API. This includes latest statistical data. Returns a promise with normalized data. 

### `fetchAPI_v2(userID : String) : Promise<UserJSON>`
Calls endpoint `2/users/:id` on the [Twitter pool](../../Data/twitter.md) to fetch user data from API. This includes latest statistical data. Returns a promise with normalized data. 

### `create(user : UserJSON) : Promise`
Creates a new row on table *User* with user data. It data is duplicate it is not added but no exceptions are thrown. 

### `read(params : UserJSON|String) : Promise<Array<UserJSON>>`
Returns all users that match filters of `UserJSON` object. If params is an string, it is assumed as `{userID: params}`.
If no matches are found, an empty response is returned. 
> NOTE: This method loads all the results into memory before returning them. When expecting a large set of results, it is recommended to use the `stream()` method instead.

### `stream(params : UserJSON|String, callbacks) : Promise`
Returns all users that match filters of `UserJSON`. If params is an string, it is assumed as `{userID: params}`.
Instead of loading every result into memory, data is streamed individually with callback functions. The promise is resolved once all rows have been returned. Callback functions are as follows:
* `onError`: Triggered if any of the rows encounters an error. Passes error as parameter.
* `onFields`: Triggered before the first result and passes fields for all upcoming results as parameter.
* `onResult`: Triggered for each row result. Row data is passed as a parameter.
* `onEnd`: Triggered once all rows have been returned, but before promise resolve.

### `update(userID : Number, user : UserJSON) : Promise`
Updates row in database specified by `userID` with new data from `user`.


### *User Stats Services*

### `UserStatsService.normalize(data : Object) : UserStatsJSON`
This method transforms JSON User data returned from Twitter API v1.1 and transforms it to `UserStatsJSON` for use within the system. This should receive the same object as `normalize()`.

### `UserStatsService.normalize_v2(data : Object) : UserStatsJSON`
This method transforms JSON User data returned from Twitter API v2 and transforms it to `UserStatsJSON` for use within the system. This should receive the same object as `normalize()`.

### `UserStatsService.create(data : UserStats) : Promise`
Creates a new row on *UserStatsFreeze* with specified data. For its nature, data is allowed to be duplicate. 
> NOTE: Care should be taken to avoid adding too much repeating data that does not add value.

### `UserStatsService.read(params : UserStatsJSON|String) : Promise<Array<UserStatsJSON>>`
Returns all stats records that match filters of params object. If params is an string, it is assumed as `{userID: params}`,
If no matches are found, an empty response is returned. 
> NOTE: This method loads all the results into memory before returning them. When expecting a large set of results, it is recommended to use the `stream()` method instead.

### `UserStatsService.stream(params : UserStatsJSON|String, callbacks) : Promise`
Works just like `stream()`

### *User Follower Services*

### `UserFollower.fetchAPI(userID : String) : Promise<Array<String>>`
Calls endpoint `1.1/followers/ids` on the [Twitter pool](../../Data/twitter.md) to fetch the ids of the latest 500 followers.
> NOTE: The rate limit for this endpoint is very low. The use of this method should be avoided when possible.

### `UserFollower.create({userID : String, followerID : String}) : Promise`
Creates a new row on *UserFollower* connecting user and follower. No duplicates are allowed.

### `UserFollower.createMany(pairs : Array<Array<String>>) : Promise`
Receives an array of user-follower pairs to be inserted as rows in *UserFollower* table.
> IMPORTANT! For performance reasons foreign checks are disabled during the execution of this method. It is important to purge the results with `removeUnexistant()` after execution to avoid unintended consequences.

### `UserFollower.removeUnexistant(userID : String) : Promise`
Removes all the followers of user that do not exist in database. 

### `read()`
Returns all user-follower records that match filters of params object. If params is an string, it is assumed as `{userID: params}`,
If no matches are found, an empty response is returned. 
> NOTE: This method loads all the results into memory before returning them. When expecting a large set of results, it is recommended to use the `stream()` method instead.

### `UserStatsService.stream(params : UserStatsJSON|String, callbacks) : Promise`
Works just like `stream()`

## Usage
These methods provide the most essential functionality for dealing with Twitter user data. Database functions make use of the `Connection.Database.connections` object. For that reason such methods should be executed only after database has been connected
```js
const Connection = require("../../Connection");
Connection.Database.connect().then(async ()=>{
    // Run functions here
})
```
For dealing with more complex or specific operations, the Twitter and Database modules from the [Connection Layer](../../Data/README.md) should be used. 