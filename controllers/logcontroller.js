'use strict';

module.exports.handleError = function(err, level) {
    if (level){
        console.log(level + ": " + err);    
    }
    else {
        console.log("ERROR: " + err.stack);
    }
};

