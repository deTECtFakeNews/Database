const Data = require("../Data");
const TweetService = require("./TweetService");

/**
 * @typedef {Object} QueryService_Data
 * @property {Array<import("./TweetService").TweetService_data>} statuses collection of tweets
 * @property {Object} queryMeta metadata
 */


/**
 * @typedef {Object} QueryService_getFromAPI_response
 * @property {Object} queryMeta metadata of executed query
 * @property {Array.<Object>} statuses collection of tweets 
 */

/**
 * @typedef {Object} QueryService_getFromAPI_filters_is
 * @property {Boolean} retweet matches all retweets
 * @property {Boolean} quote matches all quotes
 * @property {Boolean} verified delivers only tweets from verified authors
 */

/**
 * @typedef {Object} QueryService_getFromAPI_filters_has
 * @property {Boolean} hashtag matches all tweets with at least one hashtag
 * @property {Boolean} links matches all tweets with links in its body
 * @property {Boolean} mentions matches all tweets that mentions another user
 * @property {Boolean} media matches all tweets that contain a recognized media url
 * @property {Boolean} images matches all tweets that contain a recognized url to an image
 * @property {Boolean} videos matches all tweets that contain a recognized url to a video
 */

/**
 * @typedef {Object} QueryService_getFromAPI_filters
 * @property {Number|String} from matches a tweet of a specific username/userID
 * @property {Number|String} to matches a tweet in reply to a specific username/userID
 * @property {String} url performs tokenized match of any validly formatted URL of a Tweet
 * @property {Number|String} retweets_of matches tweets that are Retweets of a specified user
 * @property {String} context
 * @property {String} entity
 * @property {String} lang
 * @property {QueryService_getFromAPI_filters_is} is 
 * @property {QueryService_getFromAPI_filters_has} has
 * 
 */

const QueryService = {
    QueryTweet: {},
    /**
     * Database - Create table
     * @returns {Promise}
     */
    createTable: async()=>{
        return new Promise((resolve, reject)=>{
            let query = 
                `CREATE TABLE \`Query\` (
                    \`queryID\` INT NOT NULL AUTO_INCREMENT,
                    \`executeDate\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    \`resultType\` ENUM('recent', 'popular', 'mixed') NULL,
                    \`language\` VARCHAR(3) NULL,
                    \`resultsCount\` INT NULL,
                    \`queryJSON\` TEXT NOT NULL,
                    PRIMARY KEY (\`queryID\`));
                `;
                Data.Database.query(query, (error, results, fields)=>{
                    if(error) reject(error);
                    console.log("[QueryService] createTable successful");
                    resolve(results);
                })
        })
    },
    /**
     * Twitter API - Execute query
     * @param {String} search Query to be searched
     * @returns {Promise<QueryService_Data>}
     */
    fetchAPI: async(search)=>{
        return new Promise((resolve, reject)=>{
            Data.Twitter.get('search/tweets', {q: search}, (error, data, response)=>{
                if(error) reject(error);
                data.statuses = data.statuses.map( l=> TweetService.normalize(l) );
                data.queryMeta = data.search_metadata;
                delete data.search_metadata;
                resolve.data
            })
        })
    }

}


QueryService.QueryTweet = {
    /**
     * Database - Create table
     * @returns {Promise}
     */
    createTable: async ()=>{
        return new Promise((resolve, reject)=>{
            let query = 
            `CREATE TABLE \`QueryTweet\` (
                \`queryID\` INT(11) NOT NULL,
                \`tweetID\` BIGINT(8) NOT NULL,
                \`resultType\` ENUM('recent', 'popular', 'mixed') NULL,
                CONSTRAINT \`QueryTweets_TweetID_Tweet\`
                    FOREIGN KEY (\`tweetID\`)
                    REFERENCES \`Tweet\` (\`tweetID\`)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,
                CONSTRAINT \`QueryTweets_QueryID_Query\`
                    FOREIGN KEY (\`queryID\`)
                    REFERENCES \`Query\` (\`queryID\`)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
            );`;
            Data.Database.query(query, (error, results, fields)=>{
                if(error) reject(error);
                console.log("[QueryService.QueryTweet] createTable successful");
                resolve(results);
            });
        })
    },
    /**
     * Database - Creates (inserts new row)
     * @param {Number|String} queryID Id of query to be associated with tweet
     * @param {Number|String} tweetID Id of tweet to be associated with query
     * @param {String} resultType Result type (default=mixed)
     */
    create: async (queryID, tweetID, resultType="mixed")=>{
        return new Promise((resolve, reject)=>{
            Data.Database.query("INSERT INTO `QueryTweet` SET ?", {queryID, tweetID, resultType}, (error, results, fields)=>{
                if(error) reject(error);
                console.log("[QueryService.QueryTweet] insertToDatabase sucessful.");
                resolve(results);
            })
        })
    },
}

module.exports = QueryService;