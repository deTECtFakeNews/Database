

<!-- Start Services/UserService.js -->

UserServiceJSON Common structure for communication

### Properties:

* **String** *userID* 
* **Number** *followersCount* 
* **Number** *followingsCount* 
* **Number** *listedCount* 
* **Number** *favoritesCount* 
* **Number** *statusesCount* 
* **Date|String** *creationDate* 
* **String** *fullName* 
* **String** *screenName* 
* **String** *biography* 
* **Boolean** *isProtected* 
* **Boolean** *isVerified* 
* **String** *language* 
* **String** *placeDescription* 

UserService_StatsFreezeJSON Common structure for communication

## UserService

## normalize(data)

Internal - Receives data from  Twitter object and returns in normalized form with the same nomenclature as database.

### Params:

* **Object** *data* Data object as received by Twitter API

### Return:

* **UserService_Data** 

## createTable()

Database - Creates Table User in Database. (For backup and maintenance)

### Return:

* **Promise.\<JSON>** 

## create(user)

Database - Creates (inserts into new row) new User in table

### Params:

* **UserService_Data** *user* User data in normalized form to be added into new row

### Return:

* **Promise.\<JSON>** 

## read(query_params)

Database - Read User row(s) from table

### Params:

* **Object** *query_params* Parameters to execute query

### Return:

* **Promise.\<Array.<UserService_Data>>** 

## read2(query_params)

Database - Read User row(s) from table

### Params:

* **Number|String** *query_params* Id of row to read

### Return:

* **Promise.\<Array.<UserService_Data>>** 

## update(id, user)

Database - Update User row with new data 

### Params:

* **Number|String** *id* Id of row to be updated with data
* **UserService_Data** *user* Data of the user to be updated

### Return:

* **Promise** 

## delete(id)

Database - Delete User row

### Params:

* **Number|String** *id* Id of the user to be deleted

### Return:

* **Promise** 

## fetchAPI(id)

Twitter API - Fetch 

### Params:

* **Number|String** *id* 

### Return:

* **UserServiceJSON** 

## createTable

Database - Create table

### Return:

* **Promise** 

## create

Database - Creates (inserts into new row) new UserStatsFreeze to table

### Params:

* **UserService_StatsFreeze_Data** *userStats* User statistics to be inserted

### Return:

* **Promise** 

## read_userstats

Database - Read UserStatsFreeze row(s) from table

### Params:

* **Object** *query_params* Parameters to execute query

### Return:

* **Promise** 

## read_userstats2

Database - Read UserStatsFreeze row(s) from table

### Params:

* **Number|String** *query_params* Id of User

### Return:

* **Promise** 

## update

Database - Update UserStatsFreeze row with new data 

### Params:

* **Number|String** *id* Id of row to be updated with data
* **UserService_StatsFreeze_Data** *user* Data to be updated

### Return:

* **Promise** 

<!-- End Services/UserService.js -->

