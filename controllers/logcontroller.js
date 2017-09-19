'use strict';

const winston = require('winston');
require('winston-daily-rotate-file');

var logformat = (options) => {
    // Return string will be passed to logger.
    return options.timestamp() + ' ' + options.level.toUpperCase() + ' ' + (options.message ? options.message : '') +
        (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
};

var formattimestamp = () => {
    var ts = new Date(Date.now());
    return ts.toLocaleDateString() + " " + ts.toLocaleTimeString();
};

var rotatefile = new winston.transports.DailyRotateFile({
    filename: './log',
    datePattern: 'yyyy-MM-dd',
    prepend: true,
    localTime: true,
    maxDays: 0,
    createTree: true,
    timestamp: formattimestamp,
    formatter: logformat
});

module.exports = new winston.Logger({
    level: 'debug',
    transports: [
        new winston.transports.Console({
            timestamp: formattimestamp,
            formatter: logformat
        }),
        rotatefile
    ]
});