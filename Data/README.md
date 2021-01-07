# Data Layer
## About
The purpose of The Project is to build a tool that fetches Tweets and stores them along with relevant information and analysis. The Data Layer serves as the bridge between The Project, the Twitter API and the database

### Configuration
All the necessary parameters, keys and configuration for interfacing with the SSH client, the MySQL database and the Twitter API are outlined in the `SSH_DATA, MYSQL_DATA, TWITTER_DATA` constants. 
This creates modularity in the system allowing it to be server agnostic. 

### Structure
The file `index.js` exports an Object with the following attributes:
* **Database**: returns a `mysql.Connection` object that allows to perform queries on the database.
* **Twitter**: returns a `Twitter` object (See Twitter npm)
* **SSHDBconnect**: connect to database. (See database connection)

### Database connection
Because of the specific characteristics of the server, the connection to the database is tunneled through ssh and then forwarded back to the client. (Cumbersome, but works).
This process is executed asynchroneously. For that reason, the `Data.SSHDBconnect` function must be invoked upon execution. 

## **Database**
For purpose of this Project, the info is categorized as *Tweet*, *User* and *Query*. A relational database is built to store all the relationships between said entities. 

## (Tweet)

The Tweet is the most fundamental piece of information to which the analysisi will be focused. For that reason it is important to store *Tweet metadata*, *Tweet statistics* and the results of *Tweet analysis*. 

### Tweet

| Field         | Data type | Description   |
| ----          | ----      | ---           |
| **tweetID**   | int(11)   | [Primary key] Unique identifier |
| **authorID**  | int(11)   | [Foreign key (User)] Links to the author of the Tweet |
| **inReplyToUserID** | int(11) | [Foreign key (User)] Links to the author of the tweet being replied to, if any. |
| **inReplyToTweetID** | int(11) | [Foreign key (Tweet)] Links to the tweet being replied, if any. |
| **quotesTweetID** | int(11) | [Foreign key (Tweet)] Links to the tweet being quoted, if any. |
| creationDate  | timestamp | When the tweet was published. |
| fullText      | text      | Textual content of the Tweet. |
| placeLng      | float     | Longitude of the coordinates from which the tweet was published, if any. |
| placeLat      | float     | Latitude of the coordinates from which the tweet was published, if any. |
| placeDescription | varchar(30) | If available, the name of the place associated with the tweet's location. |
| isPossiblySensitive | boolean | Whether the content is potentially sensitive. This is determined by Twitter's algorithm. |

### TweetStatsFreeze
The statistics of a tweet are helpful to analyze its spread and reach in the network. For that reason, it is necessary to keep track of the evolution of such properties at a given moment in time.
| Field         | Data type | Description   |
| ----          | ----      | ---           |
| **tweetID**   | int(11)   | [Foreign key] Unique identifier. |
| updateDate    | timestamp | Time and date of last update. |
| retweetCount  | int       | Number of retweets. |
| favoriteCount | int       | Number of accounts that have liked the tweet. |
| replyCount    | int       | Number of replies. |

### TweetAnalysis
In another table, the data resulting from various analysis will be stored. The structure of such table is dependant on the analysis performed and can then change drastically over time. 

## (User)
Each tweet on the system is associated to at least one user (i.e., it's author). Therefore, the information about each of the associated users should also be stored in the database. This allows to analyze their posts, interactions with other accounts and to identify bias and anomalies. As with the tweet category, the information stored is in regards to *User metadata*, *User statistics* and the results of *User Analysis*.

### User
Represents a twitter account. 
> Notice: this is the only table without external references. When trying to insert tweets into the database, the user must be inserted FIRST.

| Field         | Data type | Description   |
| ----          | ----      | ---           |
| **userID**   | int(11)   | [Primary key] Unique identifier |
| creationDate | timestamp | Date the account was created. Can allow to identify bots or suspicious accounts. |
| fullName     | varchar(25) | Full name of the account, as appears on their profile. |
| screenName   | varchar(25) | Account's @username. It is not stored as a key given that it can be modified in the future, making it useless for identifying accounts in the long future. |
| biography    | text        | Short description of the account. Can be used to identify political bias, etc. |
| isProtected  | boolean     | Whether the account is protected (i.e., only approved followers can see their posts). |
| isVerified   | boolean     | Whether the account is verified by Twitter (Twitter verifies that the person using the account is who they claim). Verified accounts usually guarantee trustable sources. |
| language     | varchar(3)  | 3 letter identifier of the detected language, if any. Otherwise, `UND`. |
| placeDescription | varchar(39) | Returns the geographical location as indicated in the user's profile. |

### UserStatsFreeze
The statistics of a user allow us to identify their influence on the network (and therefore the potential reach of their posts and fake news). For that reason, it is useful to keep track of the evolution of such properties through time. 

| Field         | Data type | Description   |
| ----          | ----      | ---           |
| **userID**   | int(11)   | [Foreign key (User)] Unique identifier |
| updateDate    | timestamp | Date and time of last update. |
| followersCount | int      | Number of accounts following this account. |
| followingCount | int     | Number of accounts this account follows. |
| listedCount    | int     | Number of lists this user belongs to. |
| favoritesCount | int     | Number of tweets this user has liked. |
| statusesCount  | int     | Number of tweets (including retweets, quote tweets and replies) the user has made. |

### UserAnalysis
In another table, the data resulting from various analysis will be stored. The structure of such table is dependant on the analysis performed and can then change drastically over time.
> User as a Tweet group: Fundamentally, the analysis performed on the tweets associated with each user can be used to perform the analysis of the user *per se*. (e.g., getting average of sentiment analysis score).

## (Query)
The aforementioned categories (Tweet and User) allow for the efficient and organized storage of information. However, the scope of The Project is to fetch the data related to a topic autonomously. The specific information of the queries to be made is stored here. 

> Notice: This section is still under development to allow for the automatic and periodical execution of queries.

### Query
Each of the queries performed by the system (and hence the user) will be stored here.
> Important: unlike the rest of the tables (except analysis) the data here will be provided by the user *as is* because of the way they are implemented in Twitter's API.

| Field         | Data type | Description   |
| ----          | ----      | ---           |
| **queryID**   | int(11)   | [Primary Key] Unique identifier |
| *executeEveryNHours* | int | Tells the system to perform the query ever N hours. To execute only once, N=0.
| *firstExecuteDate* | timestamp | Date and time of first executionDate. |
| executeDate   | timestamp | Date and time of last execution date. |
| resultType    | enum (recent, popular, mixed) | Ordering used. |
| language      | varchar(3) | 3 letter code of the language used to execute the query. |
| query         | text      | String containing query as entered by user. (!) |
| resultsCount  | int       | Returns number of results.

### QueryTweets
The tweets that result from the execution of the query should be associated with itself.
> Important: The tweets that result from the query should be inserted to the database, making sure all references are included as well (e.g., data about the author, tweets it is replying to, etc.)

| Field         | Data type | Description   |
| ----          | ----      | ---           |
| **queryID**   | int(11)   | [Foreign key (Query)] Query |
| **tweetID**   | int(11)   | [Foreign key (Tweet)] Tweet |
| ~~resultType~~| enum (recent, popular, mixed) | Ordering used. |

### QueryAnalysis
In another table, the data resulting from various analysis will be stored. The structure of such table is dependant on the analysis performed and can then change drastically over time.
> The analysis performed on the tweets associated with each query can be used to perform the analysis of the query *per se*. (e.g., getting average of sentiment analysis score).

## (Resources and Roadmap)
A further extension of the database can include a resources/entities table that based on the performed analysis, is able to classify links in tweets as fake news. 

## **Twitter**
Most of the information to be entered into the database will be coming from the data fetched through Twitter's API. For that reason, it is important to guarantee the integrity of the information. Otherwise, conlfict will arise when trying to navigate through the entities and their connections. The services layer allows greater control and transparency in this process. 