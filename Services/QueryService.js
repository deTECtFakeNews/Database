const Data = require("../Data");
const TweetService = require("./TweetService");

/**
 * @typedef {Object} QueryService_Data
 * @property {Array<import("./TweetService").TweetService_data>} statuses collection of tweets
 * @property {Object} queryMeta metadata
 */

/**
 * @typedef {Object} QueryService_Row
 * @property {String|Number} queryID Id of query
 * @property {Number} executeEveryNHours How often the query is performed by system automation
 * @property {Date|String} firstExecuteDate Date and time of creation (and first execution)
 * @property {Date|String} executeDate Date and time of last execution
 * @property {(recent|popular|mixed)} resultType Ordering used
 * @property {String} language 3 letter code of the language used to execute the query
 * @property {String} query Actual query to be performed
 * @property {Number} resultsCount Number of results to be fetched 
 * 
 */

const QueryService = {
    QueryTweet: {},
    /**
     * Internal - Receives data from Twitter object and returns in normalized form with the same nomenclature as database.
     * @param {Object} data Data objext as received from Twitter API
     * @returns {QueryService_Data}
     */
    normalize: data=>{
        data.statuses = data.statuses.map( l=>TweetService.normalize(l) );
        data.queryMeta = data.search_metadata;
        delete data.search_metadata;
        return data;
    },

    /**
     * Database - Creates Table User in Database. (For backup and maintenance)
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
                console.log(`[QueryService] createTable successfully`);
                resolve(results);
            });
        })
    },
    /**
     * Database - Creates (inserts into new row) new Query in table
     * @param {QueryService_Row} query Query data to be inserted
     */
    create: async(query)=>{
        return new Promise((resolve, reject)=>{
            Data.Database.query("INSERT INTO `Query` SEt ?", query, (error, results, fields)=>{
                if(error && error.code != 'ER_DUP_ENTRY') reject (error);
                console.log('[QueryService] insertToDatabase sucesssful.');
                resolve(results);
            })
        })
    },
    /**
     * Database - Read Query row(s) from table
     * @param {Object} query_params Parameters to execute query
     * @returns {Promise<Array<QueryService_Row>>}
     */
    read: async (query_params={})=>{
        return new Promise((resolve, reject)=>{
            let query = '';
            if(Object.keys(query_params).length>0){
                query = 'SELECT * FROM Query WHERE ?';
            } else {
                query = 'SELECT * FROM Query';
            }
            Data.Database.query(query, query_params, (error, results, fields)=>{
                if(error) reject(error);
                if(results == undefined) reject();
                console.log(`[QueryService] readFromDatabase successful. results`);
                resolve( results.map(r=>({...r})));
            })
        })
    },
    /**
     * Database - Update Query row(s) with new data 
     * @param {Number | String} id Id of row to be updated with data
     * @param {QueryService_Row} query Data of the Query to be updated
     * @returns {Promise}
     */
    update: async (id, query)=>{
        return new Promise((resolve, reject)=>{
            Data.Database.query(`Update Query SET ? WHERE Query.queryID=${id}`, query, (error, results, fields)=>{
                if(error) reject (error);
                console.log(`[QueryService] updateToDatabase successful.`);
                resolve(results);
            })
        })
    },
    /**
     * Database - Delete User row   
     * @param {Number | String} id Id of the Query to be deleted
     * @returns {Promise}
     */
    delete: async(id, user)=>{
        resolve("to be implemenbted.")
    },
    /**
     * Twitter API - Execute query
     * @param {String} search Query to be searched
     * @returns {Promise<QueryService_Data>}
     */
    fetchAPI: async(search, options={
        result_type: 'mixed',
        count: 1500,
        tweet_mode: 'extended'
    })=>{
        return new Promise((resolve, reject)=>{
            Data.Twitter.get('search/tweets', {q: search, ...options}, (error, data, response)=>{
                if(error) reject(error);
                data.statuses = data.statuses.map( l=> TweetService.normalize(l) );
                data.queryMeta = data.search_metadata;
                delete data.search_metadata;
                resolve(data)
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
     */
    create: async (queryID, tweetID)=>{
        return new Promise((resolve, reject)=>{
            let mysql_query = `
            INSERT INTO QueryTweet (queryID, tweetID)
                SELECT ${queryID}, ${tweetID} from DUAL
            WHERE NOT EXISTS
                (SELECT queryID, tweetID FROM QueryTweet WHERE queryID=${queryID} AND tweetID=${tweetID});
            `

            Data.Database.query(mysql_query, (error, results, fields)=>{
                if(error) reject(error);
                console.log("[QueryService.QueryTweet] insertToDatabase sucessful.");
                resolve(results);
            })
        })
    },
    /**
     * Database - Read QueryTweet row(s) from table
     * @param {Object | Number | String} query_params Parameters to execute query | Id of query to read
     * @returns {Promise<Array<QueryService_Row>>}
     */
    read: async(query_params)=>{
        if(typeof query_params == 'number' || typeof query_params == 'string') {
            query_params = {queryID: query_params};
        }
        let query = `SELECT * FROM QueryTweet WHERE ${Object.keys(query_params).length!=0 ? '?': '1=1'}`;
        Data.Database.query(query, query_params, (error, results, fields)=>{
            if(error) reject (error);
            console.log('[QueryService.QueryTweet] readFromDatabase successful.');
            resolve(results.map(r=>({...r})));
        })
    },
    /**
     * 
     */
    readDuplicates: async()=>{
        let query = 
        `SELECT 
            queryID, COUNT(queryID),
            tweetID, COUNT(tweetID)
        FROM QueryTweet
        GROUP BY
            queryID,
            tweetID
        HAVING
            COUNT(queryID) > 1
            AND COUNT(tweetID) > 1;`;
    }
}

module.exports = QueryService;