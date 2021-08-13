const QueryService = require("../../Services/Query/QueryService");

class QueryModel {
    queryID;
    executeDate;
    query;
    shouldExecute;
    oldestDate;

    #next_token

    constructor(data){
        this.queryID = data?.queryID;
        this.executeDate = data?.executeDate;
        this.query = data?.query;
        this.oldestDate = data?.oldestDate;
    }

    async executeHistoric(){
        // Update execution date
        await QueryService.update(this.queryID, {executeDate: new Date()});
        // Fetch
        await QueryService.fetchAPI_historic(this.query, {
            start_time: '2020-01-01T00:00:00Z', 
            end_time: this.oldestDate.toISOString(),
            next_token: this.#next_token
        }, {
            onResult: async t=>{
                console.log(t.fullText.substring(0, 20)+'...');
                try{
                    const tweet = new TweetModel(t);
                    // Upload
                    await tweet.uploadToDatabase();
                    if(tweet.latestStats.last().retweetCount >= 20){
                        await tweet.retweets.getFromAPI();
                        await tweet.retweets.uploadToDatabase();
                    }
                    // Create connection
                    await QueryService.QueryTweetService.create({tweetID: tweet.tweetID, queryID: this.queryID});
                    // Update execution date
                    await QueryService.update(this.queryID, {executeDate: new Date(), oldestDate: tweet.creationDate});
                    console.log('[Models/Query] Uploaded query tweet')
                    console.log('');
                } catch(e){
                    console.error("[Models/Query] Error inserting tweet");
                }
            },
            onPage: async next_token => {
                try {
                    this.#next_token = next_token;
                    await this.executeHistoric();
                } catch(e){
                    console.log(e)
                }
            },
            onEnd: async ()=>{
                try{
                    await QueryService.update(this.queryID, {isComplete: true})
                } catch(e){
                    console.log(e)
                }
            }
        })
    }

}

m