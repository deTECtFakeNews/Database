class TweetClient{
    static async getFromAPI(id){
        let data = await (await fetch('https://localhost:3000/TWEET/fetch/'+id)).json();
        return new TweetClient(data); 
    }
    constructor(tweet){
        this.tweetID = tweet.tweetID || -1; 
        this.authorID = tweet.authorID || -1; 
        this.inReplyToUserID = tweet.inReplyToUserID || -1; 
        this.inReplyToTweetID = tweet.inReplyToTweetID || -1; 
        this.quotesTweetID = tweet.quotesTweetID || -1; 
        this.creationDate = new Date(tweet.creationDate); 
        this.fullText = tweet.fullText; 
        this.language = tweet.language; 
        this._TweetStatsFreeze = new TweetClient.TweetStatsFreeze(tweet)
    }
    getData(){
        return {
            tweetID: this.tweetID, 
            authorID: this.authorID, 
            inReplyToUserID: this.inReplyToUserID, 
            inReplyToTweetID: this.inReplyToTweetID, 
            quotesTweetID: this.quotesTweetID, 
            creationDate: this.creationDate, 
            fullText: this.fullText, 
        }
    }
    getStats(){
        return this._TweetStatsFreeze.getData();
    }
    async getEmbed(){
        return await (await fetch(`http://localhost:3000/tweet/embed/${this.tweetID}`)).text();
    }
    async getAuthor(){
        if(this.authorID != -1){
            let user = await (await fetch(`http://localhost:3000/user/fetch/${this.authorID}`)).json();
            return new UserClient(user);
        } else {
            return new UserClient({});
        }
    }
    async getRepliedUser(){
        if(this.inReplyToUserID != -1){
            let user = await (await fetch(`http://localhost:3000/user/fetch/${this.inReplyToUserID}`)).json();
            return new UserClient(user);
        } else {
            return new UserClient({});
        }
    }
    async getRepliedTweet(){
        if(this.inReplyToTweetID != -1){
            let tweet = await (await fetch(`http://localhost:3000/tweet/fetch/${this.inReplyToTweetID}`)).json();
            return new TweetClient(tweet);
        } else{
            return new TweetClient({});
        }
    }

    getDetailsTable(){
        let container = document.createElement('div');
        let embed = document.createElement('div');
            embed.className = 'twitter-tweet-embed';
        this.getEmbed().then(data=>{
            embed.innerHTML = data;
            twttr.widgets.load(embed);
        })
        let details = new DetailsTable({
            'Tweet ID': this.tweetID, 
            'Author': {
                'text': this.authorID, 
                'click': async ()=>{
                    await (await this.getAuthor()).openDialog();
                }
            },
            'Replies to (user)': {
                'text': this.inReplyToUserID, 
                'click': async ()=>{
                    await (await this.getRepliedUser()).openDialog();
                }
            },
            'Replies to (tweet)': {
                'text': this.inReplyToTweetID, 
                'click': async ()=>{
                    await (await this.getRepliedTweet()).openDialog();
                }
            }, 
            'Creation Date': this.creationDate, 
            'Full Text': this.fullText
        }).dom;

        container.append(embed, details);
        return {dom: container}
    }

    getRelatedTables(){
        // return {dom: "Hi"}
        let container = document.createElement('div');
        container.append(this._TweetStatsFreeze.getDetailsTable().dom);
        let user = this.getAuthor().then(author=>{
            container.append( author.getDetailsTable("User", true ).dom )
        })
        return {dom: container}

    }

    openDialog(){
        new Dialog(
            new Tabs({
                "Details": this.getDetailsTable().dom, 
                "Related": this.getRelatedTables().dom,
                "Analysis": "Analysis data will be here"
            }).dom
        )
    }

}

TweetClient.TweetStatsFreeze = class {
    constructor(tweet){
        this.tweetID = tweet.tweetID;
        this.updateDate = new Date(); 
        this.retweetCount = tweet.retweetCount; 
        this.favoriteCount = tweet.favoriteCount; 
        this.replyCount = tweet.replyCount;
    }
    getDetailsTable(){
        return new DetailsTable({
            'Tweet ID': this.tweetID, 
            'Last Updated': this.updateDate, 
            'Number of Retweets': this.retweetCount, 
            'Number of Likes': this.favoriteCount, 
            'Number of Replies': this.replyCount
        }, "TweetStatsFreeze")
    }
}

