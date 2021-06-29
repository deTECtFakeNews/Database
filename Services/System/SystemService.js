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

const getProcessArguments = () => {
    const argsJSON = {};
    process.argv.forEach(arg => {
        if(arg.slice(0, 2) == '--'){
            const argArr = arg.split('=');
            const argFlag = argArr[0].slice(2, argArr[0].len);
            const argVal = argArr[1];
            argsJSON[argFlag] = argVal;
        }
    });
    return argsJSON;
}

const SystemService = {delay, fetchSpreadsheet, getProcessArguments}
module.exports = SystemService;