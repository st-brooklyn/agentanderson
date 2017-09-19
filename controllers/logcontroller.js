'use strict';

const winston = require('winston');
require('winston-daily-rotate-file');

var logformat = (options) => {
    // Return string will be passed to logger.
    return options.timestamp() +' '+ options.level.toUpperCase() +' '+ (options.message ? options.message : '') +
      (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
};

var rotatefile = new winston.transport.DailyRotateFile({
    filename: './log',
    datePattern: 'yyyy-MM-dd',
    prepend: true,
    localTime: true,
    maxDays: 0,
    createTree: true,
    formatter: logformat
});

module.exports = new winston.Logger({
    level: 'debug',
    transports: [
        new winston.transports.Console({
            formatter: logformat
        }),
        rotatefile
    ]
});

