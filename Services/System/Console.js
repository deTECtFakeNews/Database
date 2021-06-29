const boxen = require('boxen');
const columnify = require('columnify');

const format = {
    bold: (text) => {
        return '\033[1m'+text+'\033[0m';
    }
}

const box = (message) => {
    log(boxen(message))
}

const log = (message) => {
    console.log(message);
}

const error = (message) => {
    console.group('❌');
    console.log(message);
}

const table = (row, options = {}) => {
    box(columnify( Array.isArray(row) ? row : [row], {
        headingTransform: (header)=>{
            return format.bold(header)
        },
    }));
    console.log();
}

const ident = () => {
    console.group();
}

const unident = () => {
    console.groupEnd();
}

const horizontalLine = (char = '-') => {
    log(char.repeat(process.stdout.columns))
}

const Console = {box, log, error, table, ident, unident, horizontalLine, format};
module.exports = Console;