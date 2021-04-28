const { QueryTweetService } = require("../../Services/Query/QueryService");
const QueryService = require("../../Services/Query/QueryService");
const TweetModel = require("../Tweet/TweetModel");

class QueryModel {
    /**@type {String} Identifier of Query in Database and Spreadsheet */
    queryID;
    /**@type {Date} Date of last execution */
    executeDate;
    /**@type {String} Text to be searched */
    query;
    /**@type {Date} Date of addition and first execution */
    firstExecuteDate;
    /**@type {Boolean} Execute the query automatically? */
    shouldExecute;
    /**@type {Array<TweetModel>} */
    savedTweets = [];
    /**@type {Array<TweetModel>} */
    latestTweets = [];
    /**
     * Creates a new object for managing queries
     * @param {import("../../Services/Query/QueryService").QueryJSON} query QueryJSON data
     */
    constructor(query){
        this.queryID = query.queryID;
        this.executeDate = query.executeDate;
        this.query = query.query;
        this.firstExecuteDate = query.firstExecuteDate;
        this.shouldExecute = query.shouldExecute;
        
    }

    async execute(){
        try{
            this.latestTweets = (await QueryService.fetchAPI(this.query)).tweets
                .map(tweet => new TweetModel(tweet));
            for(let tweet of this.latestTweets){
                try{
                    await tweet.upload();
                    this.savedTweets.push(tweet);
                    await QueryTweetService.create({tweetID: tweet.tweetID, queryID: this.queryID});
                    await QueryService.update(this.queryID, {executeDate: new Date()});
                } catch(e){
                    console.log(`Error inserting tweet with tweetID=${tweet.tweetID} and userID=${tweet.authorID}`, e)
                }
            }
        } catch(e){
            console.log("Error executing query", e)
            // throw e;
        }
    }

    streamTweets({onResult = ()=>{}, onError = ()=>{}}){
        QueryService.QueryTweetService.stream(this.queryID, {
            onResult: async (tweet)=>{
                await onResult(new TweetModel(tweet))
            }, 
            onError
        })
    }

    async pause(){
        if(this.shouldExecute == false) return;
        try{
            await QueryService.update(this.queryID, {shouldExecute: false});
        } catch(e){

        }
    }

    async resume(){
        if(this.shouldExecute == true) return;
        try{
            await QueryService.update(this.queryID, {shouldExecute: true});
        } catch(e){

        }
    }

}

module.exports = QueryModel;