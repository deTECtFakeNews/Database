const Data = require("../Data");
const TweetService = require("./TweetService");

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
    // Database - Create Table
    createTable: async ()=>{
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
     * 
     * @param {String} search terms to be searched
     * @param {QueryService_getFromAPI_filters} filters filters to be applied
     */
    getFromAPI: async(search, filters="")=>{
        return new Promise((resolve, reject)=>{
            let filters_string = "";
            if(typeof filters === "object"){
                filters_string = Object.keys(filters).filter(l=>filters[l]).map(l=>l+":"+filters[l]).join(" ");
            } else {
                filters_string = filters;
            }
            let query = {q: search + filters_string};
            Data.Twitter.get('search/tweets', {q: search + "" + filters_string}, (error, data, response)=>{
                if(error) reject(error);
                data.statuses = data.statuses.map(l=>TweetService.normalize(l));
                data.queryMeta = data.search_metadata;
                delete data.search_metadata;
                resolve(data);
            })
        })
    }, 
}

QueryService.QueryTweet = {
    // Database - Create table
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
    // Database - Insert
    insertToDatabase: (query, tweet)=>{
        return new Promise((resolve, reject)=>{
            let data = {
                queryID: query.queryID,
                tweet: tweet.tweetID,
                resultType: query.resultType
            };
            Data.Database.query("INSERT INTO `QueryTweet` SET ?", data, (error, results, fields)=>{
                if(error) reject(error);
                console.log("[QueryService.QueryTweet] insertToDatabase sucessful.");
                resolve(results);
            })
        })
    }
}

module.exports = QueryService;