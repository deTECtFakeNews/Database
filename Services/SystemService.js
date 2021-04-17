const jsonexport = require('jsonexport');

const SystemService = {
    /**
     * @param {Array<Map<String, Object>>} data
     */
    createCSV: async (data)=>{
        return await jsonexport(data);
    }, 
    delay: ms => new Promise(res => setTimeout(res, ms))
}

module.exports = SystemService;