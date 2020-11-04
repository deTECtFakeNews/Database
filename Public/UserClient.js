class UserClient{
    static async getFromAPI(id){
        let data = await (await fetch('/user/fetch/'+id)).json();
        return new UserClient(data); 
    }
    constructor(user){
        this.userID = user.userID || -1;
        this.creationDate = new Date(user.creationDate) || new Date();
        this.fullName = user.fullName;
        this.screenName = user.screenName;
        this.biography = user.biography;
        this.isProtected = user.isProtected;
        this.isVerified = user.isVerified;
        this.language = user.language;
        this.placeDescription = user.placeDescription;
        this._UserStatsFreeze = new UserClient.UserStatsFreeze(user);
    }
    getData(){
        return {
            userID: this.userID,
            creationDate: this.creationDate,
            fullName: this.fullName,
            screenName: this.screenName,
            biography: this.biography,
            isProtected: this.isProtected,
            isVerified: this.isVerified,
            language: this.language,
            placeDescription: this.placeDescription
        }
    }

    getDetailsTable(title, external = false){
        return new DetailsTable({
            'User ID': external ? {
                'text': this.userID, 
                'click': this.openDialog.bind(this)
            } : this.userID,
            'Creation Date': this.creationDate, 
            'Full Name': this.fullName, 
            'Screen Name (Username)': this.screenName, 
            'Biography': this.biography, 
            'Is Protected?': this.isProtected, 
            'Is Verified?': this.isVerified,
            'Language': this.language,
            'Place': this.placeDescription
        }, title);
    }

    getDetailsTab(){
        let container = document.createElement('div');
        container.append(this.getDetailsTable().dom);
        let feed = document.createElement('div');
            feed.className = 'twitter-user-feed';
        twttr.widgets.createTimeline({
            sourceType: "profile",
            userId: this.userID,
        }, feed);
        container.append(feed);
        return {dom: container}
    }
    getRelatedTab(){
        return {dom: "Hi"}
    }
    openDialog(){
        new Dialog(new Tabs({
            "Details": this.getDetailsTab().dom, 
            "Related": this.getRelatedTab().dom,
            "Analysis": "Analysis data will be here"
        }).dom)
    }
}

UserClient.UserStatsFreeze = class{
    constructor(user){
        this.userID = user.userID;
        this.updateDate = new Date().toISOString();
        this.followersCount = user.followersCount;
        this.followingsCount = user.followingsCount;
        this.listedCount = user.listedCount;
        this.favoritesCount = user.favoritesCount;
        this.statusesCount = user.statusesCount;
    }
    getData(){
        return {
            userID:  this.userID,
            updateDate: this.updateDate,
            followersCount:  this.followersCount,
            followingCount:  this.followingsCount,
            listedCount:  this.listedCount,
            favoritesCount:  this.favoritesCount,
            statusesCount:  this.statusesCount,
        } 
    }
}