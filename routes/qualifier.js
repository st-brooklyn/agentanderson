
'use strict';
var express = require('express');
var router = express.Router();

const line = require('@line/bot-sdk');
const db = require('../data/database');
var Mapping = require('../models/mapping');
const configfile = require('../data/config');

const qualifier_controller = require('../controllers/qualifiercontroller');


const config = {
    channelAccessToken: configfile.lineChannelAccessToken,
    channelSecret: configfile.lineChannelSecret
};

const lineclient = new line.Client(config);

function handleError(err, level) {
    if (level){
        console.log(level + ": " + err);    
    }
    else {
        console.log("ERROR: " + err.stack);
    }
}

router.get('/disqualify/:id', qualifier_controller.disqualify_get);
router.post('/disqualify/:id', qualifier_controller.disqualify_post);

/* GET home page. */
router.get('/qualify/:id', function (req, res, next) {
    var id = req.params.id;

    console.log("[Qualifier ID] => " + id);

    Mapping.findById(id)
    .then((foundone) => {
        // get the message and send back to the room
        console.log("Found: " + JSON.stringify(foundone));
        var roomId = foundone.roomId;
        var reply = foundone.replyMessage;

        // send message to room
        lineclient.pushMessage(roomId, JSON.parse(reply))
        Mapping.findByIdAndUpdate(id, 
            {$set: {action: "YES"}}, 
            {new: true})
        .then(() => {
            handleError("[Push after qualify] Message sent", "DEBUG");
        })
        .catch((pushError) => {
            handleError('[Push after qualify] ' + pushError.stack, "DEBUG")
        });
    })
    .catch((finderror) => {
        handleError("[Find one for Qualification] " + finderror.stack, "ERROR");
    });
});

// router.get('/disqualify/:id', function(req, res) {
//     // Update the database that this is not correct
//     Mapping.findById(id)
//     .then((foundone) => {
//         // get the message and send back to the room
//         var roomId = foundone.roomId;
//         var reply = foundone.replyMessage;
//         var sender = foundone.userId;

//         var message = {"type": "text", "text": "Disqualified"};

//         handleError("[Disqualification] Message is incorrect.", "WARNING");

//         lineclient.pushMessage(sender, message)
//         .then(() => {
//             handleError("[Push after qualify] Message sent", "DEBUG");
//         })
//         .catch((pushError) => {
//             handleError('[Push after qualify] ' + pushError.stack, "DEBUG")
//         });

//         // // send message to room
//         // lineclient.pushMessage(roomId, JSON.parse(reply))
//         // .then(() => {
//         //     handleError("[Push after qualify] Message sent", "DEBUG");
//         // })
//         // .catch((pushError) => {
//         //     handleError('[Push after qualify] ' + pushError.stack, "DEBUG")
//         // });
//     })
//     .catch((finderror) => {
//         handleError("[Find one for Disqualification] " + finderror.stack, "ERROR");
//     });
// });

module.exports = router;
