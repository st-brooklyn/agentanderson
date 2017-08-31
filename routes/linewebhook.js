﻿'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const db = require('../data/database');
const rc = require('recastai').default;
const hl = require('heroku-logger');

var Mapping = require('../models/mapping');

const channel_access_token = 'dIZf/b/ZabUO0IafFmPxBvcG9xPKQXtGZ6wClV70CCqTwV1TJDT1m58rdm3pko08nIimFRk5wmcElbc7mF9ZXkntG7goq5NDifdSJBkGLyReznHswZuhR77uOYc9ryJIVAfhouccWFwtKMIMucBXpQdB04t89/1O/w1cDnyilFU=';
const channel_secret = '912ad53b5e85ed684a9c52ac621d77e9';
const recast_request_token = '14dbc382a7fcd17d4df5e3a8a73a0176';

//const config = {
//    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
//    channelSecret: process.env.CHANNEL_SECRET,
//};

const config = {
    channelAccessToken: channel_access_token,
    channelSecret: channel_secret,
};

const lineclient = new line.Client(config);
const router = express.Router();

router.post('/webhook', line.middleware(config), (req, res) => {
    Promise.all(req.body.events.map(handleEvent)).then((result) => res.json(result));
});

function handleError(err, level) {
    if (level){
        console.log(level + ": " + err);    
    }
    else {
        console.log("ERROR: " + err);
    }
}

function handleEvent(event) {
    // Process only text message
    if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
    }

    // Extract the message
    if (event.source.type === 'room')
    {
        var roomId = event.source.roomId;
        var replyToken = event.replyToken;
        var originalMessage = event.message.text;
        var recastConversToken = null;

        var mappingId = '';

        handleError('[Main] Incoming message: ' + originalMessage + '. Room Id: ' + roomId, "DEBUG");

        // Check if the conversation exists -- using roomId
        Mapping.findOne({roomId: roomId}, 'roomId conversationToken')
        .then((mapping) => {
            if(mapping) {
                // Mapping exists, set the converse token
                handleError('[Check room Id] Found a mapping with a Token: ' + mapping.conversationToken, "DEBUG");
                recastConversToken = mapping.conversationToken;
                mappingId = mapping._id;
            }
            else {
                // No mapping -> create a new one [converse token is still null]
                handleError('[Check room Id] No mapping found', "DEBUG");
                Mapping.create({
                    roomId: roomId,
                    userId: event.source.userId,
                    conversationToken: null,
                    createdDate: new Date().toJSON(),
                    modifiedDate: new Date().toJSON(),
                    originalMessage: originalMessage
                })
                .then((createdmapping) => {
                    mappingId = mapping._id;
                    handleError("[Create mapping] Created with Id: " + mapping._id, "DEBUG");
                })
                .catch((errorcreate) => {
                    handleError('[Create mapping] ' + errorcreate);
                });
            }

            var recastrequest = new rc.request(recast_request_token);
            handleError("[Main] recastConversToken: " + recastConversToken, "DEBUG");

            recastrequest.converseText(event.message.text, { conversationToken: recastConversToken })
            .then(function (recast_response) {                
                handleError("[ConversText] Recast: " + JSON.stringify(recast_response), "DEBUG");
                handleError("[ConversText] Mapping Id: " + mappingId, "DEBUG");

                // Update conversation token back to the mapping 
                // and Set the converse token
                if (recastConversToken == null) {
                    Mapping.findById(mappingId)
                    .then((mappingtoupdate) => {
                        if(mappingtoupdate) {
                            handleError("[Find when null token] Found a mapping with Id: " + JSON.stringify(mappingtoupdate), "DEBUG");

                            Mapping.findByIdAndUpdate(mappingId, 
                                {$set: {conversationToken: recast_response.conversationToken}}, 
                                {new: true})
                            .then((affected) => {
                                // update the converse token
                                recastConversToken = affected.conversationToken;
                                handleError("[Find and update token] Affected: " + affected, "DEBUG");
                                handleError("[Find and update token] Updated conversation token: " + recastConversToken, "DEBUG");
                            })
                            .catch((errupdate) => {
                                handleError('[Find and update token] ' + errupdate);
                            });
                        }
                        else {
                            return handleError("[Find and update token] Mapping not found.", "WARNING");
                        }
                    })
                    .catch((errfind) => {
                        handleError('[Find when null token] ' + errfind);
                    });
                }
                else {
                    // recastConversToken is not null
                    // No need to update
                }

                // Extract the reply from recast
                var intent = recast_response.action.slug;
                handleError("[Main] Intent: " + intent, "INFO");

                var isdone = recast_response.action.done;
                handleError("[Main] Done?: " + isdone, "INFO");

                var actual_token = recast_response.conversationToken;

                // Construct the reply message
                var mockup_products = require('./products.json');

                const linehelper = require('../controllers/LineMessageController');
                var reply_carousel = linehelper.createProductCarousel(mockup_products);

                var reply_confirm = linehelper.createConfirmation(intent, recast_response.conversationToken, mappingId);


                var reply = recast_response.reply() + '\n' + recast_response.conversationToken;                
                if(reply == null) {
                    reply = '[Error]\n' + recast_response.conversationToken;
                }

                var reply_text = {
                    "type": "text",
                    "text": reply
                };
        
                const messages = [];
                messages.push(reply_text);
                messages.push(reply_carousel);
                messages.push(reply_confirm);

                // Send reply to the sender --> reservation //
                // 1. Get the sender by the mappingId
                var senderId = '';

                Mapping.findById(mappingId)
                .then((senderMapping) => {
                    if(senderMapping) {
                        senderId = senderMapping.userId;
                        handleError("[Find for sender] Sender Id: " + senderId, "DEBUG");
                        
                        lineclient.pushMessage(senderId, messages)
                        .then(() => {
                            // process after push message to Line
                            handleError("[Push message] Line message sent to the sender.", "DEBUG");

                            // Save the response back to the mapping -> replyMessage [JSON.stringify]
                            Mapping.findByIdAndUpdate(mappingId, 
                                {$set: {replyMessage: JSON.stringify(reply_carousel)}}, 
                                {new: true})
                            .then((mappingUpdateReply) => {                                
                                handleError("[Find to update reply] Updated response mapping: " + mappingUpdateReply, "DEBUG");                                
                            })
                            .catch((errupdate) => {
                                handleError('[Find to update reply] ' + errupdate);
                            });                            
                        })
                        .catch((errpush) => {
                            // error handling
                            handleError("[Push message] Push failed. " + errpush);
                        });
                    }
                    else {
                        handleError("[Find for sender] Mapping for sender not found", "WARNING");
                    }                    
                })
                .catch((errfind) => {
                    handleError("[Find for sender] Find sender failed. " + errfind);
                });
            }) // End then findById
            .catch((err) => {
                handleError(err);
            });            
        }) // End then
        .catch((errfindone) => {
            handleError(errfindone);
        }); 
            
            

            
            

    }

    //Extract data from line message

    //// create a echoing text message
    //const echo = { type: 'text', text: event.message.text };

    //// use reply API
    //return client.replyMessage(event.replyToken, echo);

    // create data entries

    // extract data
}

module.exports = router;