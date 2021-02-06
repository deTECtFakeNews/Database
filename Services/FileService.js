const jsonexport = require('jsonexport');

const FileService = {
    /**
     * @param {Array<Map<String, Object>>} data
     */
    createCSV: async (data)=>{
        return await jsonexport(data);
    }
}

module.exports = FileService;