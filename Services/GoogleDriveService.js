const fetch = require('node-fetch')

const GoogleDriveService = {
    /**
     * Reads live data from a Google Spreadsheet in JSON format
     * @param {String} spreadsheetID ID of Spreadsheet to read
     * @param {String} sheet (Default 1) Sheet number
     */
    readSpreadsheet: async(spreadsheetID, sheet)=>{
        let request = await fetch(`https://spreadsheets.google.com/feeds/list/${spreadsheetID}/${sheet}/public/values?alt=json`);
        let data = await request.json();
        let entries = data.feed.entry.map(entry=>{
            let _entry = {};
            Object.keys(entry).forEach(key=>{
                if(key.startsWith('gsx$')){
                    _entry[ key.substring(4) ] = entry[key].$t
                }
                _entry._meta = {updated: entry.updated.$t}
            })
            return _entry;
        })

        return {
            updated: data.feed.updated.$t,
            title: data.feed.title.$t,
            authors: data.feed.author.map(author=>author.email.$t),
            entries
        }
    }
}

module.exports = GoogleDriveService;