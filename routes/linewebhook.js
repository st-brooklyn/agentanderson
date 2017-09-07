'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const db = require('../data/database');
const rc = require('recastai').default;
const configfile = require('../data/config');
const rp = require('request-promise');

var Mapping = require('../models/mapping');
var APIUrl = require('../data/api');

const config = {
    channelAccessToken: configfile.lineChannelAccessToken,
    channelSecret: configfile.lineChannelSecret
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
        console.log("ERROR: " + err.stack);
    }
}

function createProductCarousel(products) {
    var parsedProducts = products;
    
    var carousel = {
        "type": "template",
        "altText": "this is a carousel template",
        "template": {   
            "type": "carousel",
            "columns": []
        }
    };

    parsedProducts.data.products.forEach((product) => {
        var column = {
            "thumbnailImageUrl": product.url_pic,
            "title": product.product_name.substr(0, 40),
            "text": "Fix Text",
            "actions": [                
                {
                    "type": "uri",
                    "label": "View detail",
                    "uri": "http://www.google.com"
                },
                {
                    "type": "uri",
                    "label": "View Slide",
                    "uri": "http://www.facebook.com"
                }
            ]
        };

          carousel.template.columns.push(column);
    }, this);

    console.log("DEBUG: [createProductCarousel] " + JSON.stringify(carousel));

    return carousel;
}

function createConfirmation(mappingId) {
    var confirm = {
        "type": "template",
        "altText": "this is a confirm template",
        "template": {
            "type": "confirm",
            "text": "Message correct?",
            "actions": [
                {
                  "type": "postback",
                  "label": "Yes",
                  "data": "qualify/" + mappingId,
                  "text": "Message sent. :)"
                },
                {
                  "type": "uri",
                  "label": "No",
                  "uri": "https://agentanderson.herokuapp.com/qualifier/disqualify/" + mappingId
                }
            ]
        }
    };

    console.log("DEBUG: [createConfirmation] " + JSON.stringify(confirm));

    return confirm;
}

function createAiResultMessage(intent, converseToken, replyFromAi, sourceMessage) {
    return {
        "type" : "text",
        "text" : 'Source: ' + sourceMessage + '\nMessage: ' + replyFromAi + '\nIntent: ' + intent + '\nConverse Token: ' + converseToken
    };
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

        // // for testing -> delete the entry
        // Mapping.findOneAndRemove({roomId: roomId})
        // .then((res) => {
        //     handleError("[Remove an entry] Removed.", "DEBUG");
        // })
        // .catch((error) => {
        //     handleError(error);
        // });

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
                    originalMessage: originalMessage,
                    replyMessage: null
                })
                .then((createdmapping) => {
                    mappingId = createdmapping._id;
                    handleError("[Create mapping] Created with Id: " + createdmapping._id, "DEBUG");
                })
                .catch((errorcreate) => {
                    handleError('[Create mapping] ' + errorcreate.stack, "ERROR");
                });
            }

            var recastrequest = new rc.request(configfile.recastRequestToken);
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
                                handleError('[Find and update token] ' + errupdate.stack, "ERROR");
                            });
                        }
                        else {
                            return handleError("[Find and update token] Mapping not found.", "WARNING");
                        }
                    })
                    .catch((errfind) => {
                        handleError('[Find when null token] ' + errfind.stack, "ERROR");
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

                // Call api tour    
                var entities = recast_response.entities;
                handleError("[Main] entities?: " + JSON.stringify(entities), "INFO");
                // Call function convert country to country_slug 
                // Call function convert city to city_slug 
                // Call function convert airline name to airline code
                // Call function convert date to format date yyyy-mm-dd
                // Call function convert month to format mm
                
                // Construct the reply message
                // tourresuilt = tour.gettour(cpuntry, city, periond, pax)
                var mockup_products = null


                var rpoptions = {
                    uri: 'http://apitest.softsq.com:9001/JsonSOA/getdata.ashx',
                    qs: {
                        apikey: 'APImushroomtravel',
                        mode: 'searchresultsproduct',
                        lang: 'th',
                        country_slug: 'hong-kong',
                        pagesize: '1',
                        pagenumber: '1',
                        searchword: 'MUSH151377'
                    },
                    headers: {
                        'User-Agent': 'Request-Promise'
                    },
                    json: true // Automatically parses the JSON string in the response
                };

                var isdone = false;

                rp(rpoptions)
                .then((repos) => {
                    handleError("[API Mockup] Repos: " + JSON.stringify(repos), "DEBUG");
                    mockup_products = repos;
                    isdone = true;
                })
                .then(() => {
                    if(mockup_products == null) {
                        handleError("[API Mockup] No products found. Get it from file.", "DEBUG");
                        mockup_products = require('./products.json');
                    } else {
                        if (mockup_products.data.results == 0){
                            mockup_products = require('./products.json');
                        }
                    }

                    //const linehelper = require('../controllers/LineMessageController');
                    var reply_carousel = createProductCarousel(mockup_products);
                    var reply_details = createAiResultMessage(intent, recast_response.conversationToken, recast_response.reply(), recast_response.source);
                    var reply_confirm = createConfirmation(mappingId);

                    var reply = recast_response.reply() + '\n' + recast_response.conversationToken;                
                    if(reply == null) {
                        reply = '[Error]\n' + recast_response.conversationToken;
                    }

                    var reply_text = {
                        "type": "text",
                        "text": reply
                    };
            
                    const messages = [];                
                    messages.push(reply_carousel);
                    messages.push(reply_details);
                    messages.push(reply_confirm);

                    handleError('[Main] Messages: ' + JSON.stringify(messages), "DEBUG");

                    var senderId = '';

                    Mapping.findById(mappingId)
                    .then((senderMapping) => {
                        if(senderMapping) {
                            senderId = senderMapping.userId;
                            handleError("[Find for sender] Sender Id: " + senderId, "DEBUG");
                            
                            lineclient.pushMessage(senderId, messages)
                            .then(() => {
                                // process after push message to Line
                                handleError("[Push carousel] Carousel sent to the sender.", "DEBUG");

                                // Save the response back to the mapping -> replyMessage [JSON.stringify]
                                Mapping.findByIdAndUpdate(mappingId, 
                                    {$set: {replyMessage: JSON.stringify(reply_carousel)}}, 
                                    {new: true})
                                .then((mappingUpdateReply) => {                                
                                    handleError("[Find to update reply] Updated response mapping: " + mappingUpdateReply, "DEBUG");
                                })
                                .catch((errupdate) => {
                                    handleError('[Find to update reply] ' + errupdate.stack, "ERROR");
                                });
                            })
                            .catch((errPushCarousel) => {
                                // error handling
                                handleError("[Push carousel] Push failed. " + errPushCarousel.stack, "ERROR");
                            });
                        }
                        else {
                            handleError("[Find for sender] Mapping for sender not found", "WARNING");
                        }                    
                    })
                    .catch((errfind) => {
                        handleError("[Find for sender] Find sender failed. " + errfind.stack, "ERROR");
                    });
                })
                .catch((rperr) => {
                    handleError("[API Mockup] " + rperr.stack, "ERROR");
                });

                // var api_request = require('request');
                // api_request.get({
                //     url: 'http://apitest.softsq.com:9001/JsonSOA/getdata.ashx?apikey=APImushroomtravel&mode=loadproductchatbot&lang=th&url_request=outbound/china&pagesize=1&pagenumber=1',
                //     json: true
                //     //headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36'}
                // })
                // .then((apiresponse, apidata) => {
                //     handleError("[API Mockup]" + JSON.stringify(apidata), "DEBUG");                    
                //     mockup_products = apidata;

                //     //if(mockup_products == null) {
                //     //    mockup_products = require('./products.json');
                //     //}
                // })
                // .catch((apierr) => {
                //     handleError("[API Mockup] " + apierr.stack, "ERROR");
                // });

                // if(mockup_products == null) {
                //     handleError("[API Mockup] No products found. Get it from file.", "DEBUG");
                //     mockup_products = require('./products.json');
                // }

                // //const linehelper = require('../controllers/LineMessageController');
                // var reply_carousel = createProductCarousel(mockup_products);
                // var reply_details = createAiResultMessage(intent, recast_response.conversationToken, recast_response.reply(), recast_response.source);
                // var reply_confirm = createConfirmation(mappingId);


                // var reply = recast_response.reply() + '\n' + recast_response.conversationToken;                
                // if(reply == null) {
                //     reply = '[Error]\n' + recast_response.conversationToken;
                // }

                // var reply_text = {
                //     "type": "text",
                //     "text": reply
                // };
        
                // const messages = [];                
                // messages.push(reply_carousel);
                // messages.push(reply_details);
                // messages.push(reply_confirm);

                // handleError('[Main] Messages: ' + JSON.stringify(messages), "DEBUG");

                // Send reply to the sender --> reservation //
                // 1. Get the sender by the mappingId
                // var senderId = '';

                // Mapping.findById(mappingId)
                // .then((senderMapping) => {
                //     if(senderMapping) {
                //         senderId = senderMapping.userId;
                //         handleError("[Find for sender] Sender Id: " + senderId, "DEBUG");
                        
                //         lineclient.pushMessage(senderId, messages)
                //         .then(() => {
                //             // process after push message to Line
                //             handleError("[Push carousel] Carousel sent to the sender.", "DEBUG");

                //             // Save the response back to the mapping -> replyMessage [JSON.stringify]
                //             Mapping.findByIdAndUpdate(mappingId, 
                //                 {$set: {replyMessage: JSON.stringify(reply_carousel)}}, 
                //                 {new: true})
                //             .then((mappingUpdateReply) => {                                
                //                 handleError("[Find to update reply] Updated response mapping: " + mappingUpdateReply, "DEBUG");
                //             })
                //             .catch((errupdate) => {
                //                 handleError('[Find to update reply] ' + errupdate.stack, "ERROR");
                //             });
                //         })
                //         .catch((errPushCarousel) => {
                //             // error handling
                //             handleError("[Push carousel] Push failed. " + errPushCarousel.stack, "ERROR");
                //         });
                //     }
                //     else {
                //         handleError("[Find for sender] Mapping for sender not found", "WARNING");
                //     }                    
                // })
                // .catch((errfind) => {
                //     handleError("[Find for sender] Find sender failed. " + errfind.stack, "ERROR");
                // });
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