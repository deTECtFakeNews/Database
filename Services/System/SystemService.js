const { default: fetch } = require("node-fetch");

const delay = (ms) => new Promise(res => {
    if(ms < 0) res()
    else setTimeout(res, ms)
});

const fetchSpreadsheet = async (spreadsheetID, sheetID) => {
    let link = `https://spreadsheets.google.com/feeds/list/${spreadsheetID}/${sheetID}/public/values?alt=json`;
    // console.log(link)
    let request = await fetch(`https://spreadsheets.google.com/feeds/list/${spreadsheetID}/${sheetID}/public/values?alt=json`);
    let data = await request.json();
    return data.feed;
}

const SystemService = {delay, fetchSpreadsheet};
module.exports = SystemService;