const logger = require('./logcontroller');
const Mapping = require('../models/mapping');
const Recast = require('../models/recast');
const ConfirmationResult = require('../models/confirmationresult');
const configs = require('../data/config');
const line = require('@line/bot-sdk');
const tpc = require('./templatecontroller');
const rp = require('request-promise');

exports.qualify_get = function(id, recastUuid){
    logger.debug("[Qualify]", {mappingId: id, recastUuid: recastUuid});

    Mapping.findById(id)
    .then((foundone) => {
        // get the message and send back to the room
        logger.silly("[Qualify] Found a mapping.", foundone);

        var foundRecastUuid = foundone.recastUuid;
        var isSent = foundone.isSent;

        if(isSent == true && recastUuid == foundRecastUuid) {
            logger.debug('[Qualify] This message is already sent.');

            // lineclient.pushMessage(foundone.reservationId, tpc.templateReply(configs.predefinedMessages.confirmSuccess))
            // .then((notify) => {
            //     logger.debug('[Qualify] Push confirm success', notify);
            // })
            // .catch((confirmerr) => {
            //     logger.error('[Qualify] Push confirm failed.', confirmerr);
            // });
        }
        else {
            var roomId = foundone.roomId;
            var reply = foundone.replyMessage;
            
            reply = reply.replace('/\[\[.*\]\]/', '');
            logger.silly('[Qualify] Replaced message', {ModifiedReply: reply});
    
            ConfirmationResult.create({
                mappingId: id,
                intent: foundone.intent,
                message: '',
                reservationId: foundone.customerId,
                result: true,
                apiPayload: foundone.apiPayload,
                createdDate: new Date().toJSON(),
                modifiedDate: new Date().toJSON()
            })
            .then((created) => {
                logger.debug("[Create Recast-YES]", created);
            })
            .catch((error) => {
                logger.error("[Create Recast-NO", error);
            });

            // send message to room
            var lineclient = new line.Client(configs.botmapping.default);

            lineclient.pushMessage(roomId, JSON.parse(reply))            
            .then(() => {
                logger.debug("[Push after qualify] Message sent");

                Mapping.findByIdAndUpdate(id, 
                    {$set: {
                        action: "YES",
                        isSent: true,
                        modifiedDate: new Date().toJSON()
                    }}, 
                    {new: true})
                .then((updatedone) => {
                    logger.debug('[Qualify] Updated mapping.', updatedone)
                })
                .catch((errUpdate) => {
                    logger.error('[QUalify] Failed updating mapping', errupdate);
                });
                if (configs.modetraining == true){
                    var training = {
                        uri: 'http://chatlog.tourprox.com/train/send',
                        headers: {
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                            'User-Agent': 'Request-Promise'
                        },
                        json: false 
                    };
                    rp(training)
                    .then((train) => {
                        logger.debug("[train] train:", train);
                    })
                    .catch((error)=> {
                        logger.error("[train]", error);
                    });
                } else {
                    lineclient.pushMessage(foundone.customerId, tpc.templateReply(intent, configs.predefinedMessages.confirmSuccess))
                    .then((notify) => {
                        logger.debug('[Qualify] Push confirm success', notify);
                    })
                    .catch((confirmerr) => {
                        logger.error('[Qualify] Push confirm failed.', confirmerr);
                    });
                }
            })
            .catch((pushError) => {
                logger.error('[Push after qualify]', pushError);            
            });
        }
    })
    .catch((finderror) => {
        logger.error("[Find one for Qualification]", finderror);        
    });
};

exports.disqualifytraining_get = function(id, recastUuid){
    logger.debug("[DisQualify Training]", {mappingId: id, recastUuid: recastUuid});

    Mapping.findById(id)
    .then((foundone) => {
        // get the message and send back to the room
        logger.silly("[DisQualify Training] Found a mapping.", foundone);

        var foundRecastUuid = foundone.recastUuid;
        var isSent = foundone.isSent;

        if(isSent == true && recastUuid == foundRecastUuid) {
            logger.debug('[DisQualify Training] This message is already sent.');
        }
        else {
            var roomId = foundone.roomId;
            var reply = foundone.replyMessage;
            
            reply = reply.replace('/\[\[.*\]\]/', '');
            logger.silly('[DisQualify Training] Replaced message', {ModifiedReply: reply});
    
            ConfirmationResult.create({
                mappingId: id,
                intent: foundone.intent,
                message: '',
                reservationId: foundone.customerId,
                result: true,
                apiPayload: foundone.apiPayload,
                createdDate: new Date().toJSON(),
                modifiedDate: new Date().toJSON()
            })
            .then((created) => {
                logger.debug("[Create DisQualify Recast-YES]", created);
            })
            .catch((error) => {
                logger.error("[Create DisQualify Recast-NO", error);
            });

            // send message to room
            var lineclient = new line.Client(configs.botmapping.default);

            lineclient.pushMessage(roomId, JSON.parse(reply))            
            .then(() => {
                logger.debug("[Push after DisQualify] Message sent");

                Mapping.findByIdAndUpdate(id, 
                    {$set: {
                        action: "No",
                        isSent: true,
                        modifiedDate: new Date().toJSON()
                    }}, 
                    {new: true})
                .then((updatedone) => {
                    logger.debug('[DisQualify Training] Updated mapping.', updatedone)
                })
                .catch((errUpdate) => {
                    logger.error('[DisQualify Training] Failed updating mapping', errupdate);
                });

                var training = {
                    uri: 'http://chatlog.tourprox.com/train/send',
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                        'User-Agent': 'Request-Promise'
                    },
                    json: false 
                };
                rp(training)
                .then((train) => {
                    logger.debug("[train] train:", train);
                })
                .catch((error)=> {
                    logger.error("[train]", error);
                });
                
            })
            .catch((pushError) => {
                logger.error('[Push after disqualify train]', pushError);            
            });
        }
    })
    .catch((finderror) => {
        logger.error("[Find one for DisQualification]", finderror);        
    });
};

exports.disqualify_get = function(req, res, next) {
    logger.silly("[Disqualify] Data", req);
    if (configs.modetraining == true){


    } else{
        Recast.findOne({mappingId: req.params.id}).sort({ "_id": -1 })
        .then((foundone) => {
            // get the message and send back to the room
            logger.silly("[DisQualify] Found a recast.", foundone.responseMessage);
            var resMessage = foundone.responseMessage;

            var source = resMessage.source;
            var intent = '';
            if (resMessage.action != null){
                intent = resMessage.action.slug;
            } else {
                intent = 'tour-search'
            }

            var entity = resMessage['entities'];
            var memory = resMessage['memory'];

            if (configs.readrecast != 'memory') {
                
                res.render('disqualify_form', {title: 'Disqualify Form', 
                    mappingId: req.params.id, 
                    source: source,
                    intent: intent,
                    country: entity['country'] ? entity['country'][0] ? entity['country'][0]['value'] : null : null,
                    city: entity['city'] ? entity['city'][0] ? entity['city'][0]['value'] : null : null,
                    region: entity['region'] ? entity['region'][0] ? entity['region'][0]['value'] : null : null,
                    tourcode: entity['tourcode'] ? entity['tourcode'][0] ? entity['tourcode'][0]['value'] : null : null,
                    price: entity['price'] ? entity['price'][0] ? entity['price'][0]['value'] : null : null,
                    departuredate: entity['departure-date'] ? entity['departure-date'][0] ? entity['departure-date'][0]['value'] : null : null,
                    returndate: entity['returndate'] ? entity['returndate'][0] ? entity['returndate'][0]['value'] : null : null,
                    month: entity['month'] ? entity['month'][0] ? entity['month'][0]['value'] : null : null,
                    period: entity['period'] ? entity['period'][0] ? entity['period'][0]['value'] : null : null,
                    holiday: entity['holiday'] ? entity['holiday'][0] ? entity['holiday'][0]['value'] : null : null,
                    traveler: entity['traveler'] ? entity['traveler'][0] ? entity['traveler'][0]['value'] : null : null,
                    traveleradult: entity['traveler_adult'] ? entity['traveler_adult'][0] ? entity['traveler_adult'][0]['value'] : null : null,
                    traveler_child: entity['traveler_child'] ? entity['traveler_child'][0] ? entity['traveler_child'][0]['value'] : null : null
                });     

                logger.silly("[DisQualify] send to form", {
                    Mapping: mappingId, 
                    Intent: intent,
                    Country: country,
                    Tourcode: Tourcode,
                    Departuredate: departuredate,
                    Returndate: returndate,
                    Month: month,
                    Traveler: traveler});      
            } else {
                res.render('disqualify_form', {title: 'Disqualify Form', 
                    mappingId: req.params.id, 
                    intent: intent,
                    source: source,
                    country: memory['destination'] ? memory['destination'] ? memory['destination']['value'] : null : null,
                    tourcode: memory['tourcode'] ? memory['tourcode'] ? memory['tourcode']['value'] : null : null,
                    departuredate: memory['departure-date'] ? memory['departure-date'] ? memory['departure-date']['value'] : null : null,
                    returndate: memory['returndate'] ? memory['returndate'] ? memory['returndate']['value'] : null : null,
                    month: memory['month'] ? memory['month'] ? memory['month']['value'] : null : null,
                    traveler: memory['traveler'] ? memory['traveler'] ? memory['traveler']['value'] : null : null
                });

                logger.silly("[DisQualify] send to form", {
                    Mapping: mappingId, 
                    Intent: intent,
                    Country: country,
                    Tourcode: Tourcode,
                    Departuredate: departuredate,
                    Returndate: returndate,
                    Month: month,
                    Traveler: traveler}); 
            }
        });
    }
    //res.render('disqualify_form', {title: 'Disqualify Form', mappingId: req.params.id});
};

exports.disqualify_post = function(req, res, next) {
    //const log = require('./logcontroller');
    var messages = [];    
    // Perform validation here form the submitted form data
    // req.body.<field_name>

    var hasError = false;
    logger.silly("[Disqualify Post] Payload", req.body);
    var payload = "";
    // {
    //     "mappingId":"59b62f882eb59000125491f5",
    //     "intent":"tour-search",
    //     "country":"ญี่ปุ่น",
    //     "tourcode":"xxxxxx",
    //     "departuredate":"2017-09-02",
    //     "returndate":"2018-01-01",
    //     "traveler": "2"
    // }

    // Check if Mapping Id is passed
    //req.checkBody('mappingId', 'No mapping ID found').notEmpty();
    // console.log("Mapping ID: " + req.body.mappingId);
    // console.log("Country Name: " + req.body.country);
    // console.log("Product Code: " + req.body.tourcode);
    
    var intent = req.body.intent;
    var tourcode = req.body.tourcode;
    var mappingId = req.body.mappingId;
    var traveler = req.body.traveler;
    var departuredate = req.body.departuredate;
    var returndate = req.body.returndate;
    var country = req.body.country;
    var departuremonth = req.body.departuremonth;
    var returnmonth = req.body.returnmonth;

     logger.debug('[Disqualify Post] Extracted values.', {
         intent: intent,
         tourcode: tourcode,
         mappingId: mappingId,
         traveler: traveler,
         departuredate: departuredate,
         returndate: returndate,
         departuremonth: departuremonth,
         returnmonth: returnmonth,
         country: country,
     });
     // //Check that the name field is not empty
    // req.checkBody('name', 'Genre name required').notEmpty();
    
    // //Trim and escape the name field. 
    // req.sanitize('name').escape();
    // req.sanitize('name').trim();
    
    // //Run the validators
    // var errors = req.validationErrors();

    // //Create a genre object with escaped and trimmed data.
    // var genre = new Genre(
    //   { name: req.body.name }
    // );

    // const lh = require('../LineHelper');
    // var hh = new lh();
    // var name = hh.getUserDisplayName('userid');
    
    
    if (hasError) {
        //If there are errors render the form again, passing the previously entered values and errors
        //res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors});
    return;
    } 
    else {
        // Data from the form is valid.
        // Continue with the logic to disqualify
        var products = null;
        var requestSuccess = false;
        var timeout = configs.apitimeout;

        const rp = require('request-promise');

        var rpoptions = {
            uri: configs.apiUrl,
            qs: {
                apikey: 'APImushroomtravel',
                mode: 'loadproductchatbot',
                lang: 'th',
                pagesize: configs.apisizepage,
                pagenumber: '1',
                sortby: 'mostpopular',
                country_slug: country,
                startdate: departuredate,
                enddate: returndate,
                month: returnmonth,
                searchword: tourcode
            },
            headers: {
                'User-Agent': 'Request-Promise'
            },
            json: true // Automatically parses the JSON string in the response
        };

        rp(rpoptions)
        .then((repos) => {
            logger.debug("[Disqualify] Response from API: ", repos);
            products = repos;
            requestSuccess = true;

            // Update payload back to the mapping
            payload = tpc.createApiPayload(intent, country, departuredate, returndate, month, tourcode);
            Mapping.findByIdAndUpdate(mappingId, 
                {$set: {
                    action: "NO",
                    apiPayload: payload, 
                    modifiedDate: new Date().toJSON()}
                },
                {new: true}
            )
            .then((updated) => {
                logger.debug("[Update Payload] Mapping updated,", updated);
            })
            .catch((updateerr) => {
                logger.error('[Update Payload] Error updating mapping.', updateerr);
            });
        })
        .catch((error)=> {
            logger.error('[Disqualify] Error sending request to API.', error);
        });

        while(true)
        {
            if (requestSuccess == true || timeout == 0) {
                logger.debug('[Disquality] Products arrived!!')                                
                break;
            }

            logger.debug('[Disqualify] Waiting for product.', {
                requestSuccess: requestSuccess,
                timeout: timeout
            });
            require('deasync').sleep(500);
            timeout -= 500;
        }

        var reply_carousel = null;
        var reply_confirm  = '';
        var replyToClient = '';

        if(products != null) {
            if(products.data.results > 0) {
                //tpc.templateCarousel(products);
                // var reply_carousel = tpc.templateCarousel(products, payload);
                reply_carousel = tpc.templateUrl(products, payload);
                reply_confirm = tpc.templateConfirm(mappingId, '');
                messages.push(reply_carousel);
                messages.push(reply_confirm);
            } else {
                replyToClient = tpc.templateReply(intent, configs.apinotfound);
                reply_confirm = tpc.templateConfirm(mappingId, '');
                messages.push(replyToClient);
                messages.push(reply_confirm);
            }

            Mapping.findById(mappingId)
                .then((senderMapping) => {
                    if(senderMapping) {
                        logger.debug("[Disqualify] Found a mapping.", senderMapping);

                        var customerId = senderMapping.customerId;                        
                        var lineclient = new line.Client(configs.botmapping.default);
                        lineclient.pushMessage(customerId, messages)
                        .then(() => {
                            // process after push message to Line
                            //handleError("[Push carousel] Carousel sent to the sender.", "DEBUG");
                            logger.debug("[Disqualify] Messages sent.");
                            if (reply_carousel == null){
                                Mapping.findByIdAndUpdate(mappingId, 
                                    {$set: {replyMessage: JSON.stringify(replyToClient)}},
                                    {new: true})
                                .then((mappingUpdateReply) => {                                
                                    //handleError("[Find to update reply] Updated response mapping: " + mappingUpdateReply, "DEBUG");
                                    logger.debug("[Disqualify] Mapping updatedg.", mappingUpdateReply);
                                })
                                .catch((errupdate) => {
                                    //handleError('[Find to update reply] ' + errupdate.stack, "ERROR");
                                    logger.error("[Disqualify] Error updating a mapping", errupdate);
                                });

                            } else {
                                Mapping.findByIdAndUpdate(mappingId, 
                                    {$set: {replyMessage: JSON.stringify(reply_carousel)}},
                                    {new: true})
                                .then((mappingUpdateReply) => {                                
                                    //handleError("[Find to update reply] Updated response mapping: " + mappingUpdateReply, "DEBUG");
                                    logger.debug("[Find to update reply]", {mappingUpdateReply: mappingUpdateReply});
                                })
                                .catch((errupdate) => {
                                    //handleError('[Find to update reply] ' + errupdate.stack, "ERROR");
                                    logger.error("[Find to update reply]", {stack: errupdate.stack});
                                });                                        
                            }

                            // Save the response back to the mapping -> replyMessage [JSON.stringify]                               
                        })
                        .catch((errPushCarousel) => {
                            // error handling
                            //handleError("[Push carousel] Push failed. " + errPushCarousel.stack, "ERROR");
                            logger.error("[Push carousel]", {stack: errPushCarousel.stack});
                        });
                    }
                    else {
                        //handleError("[Find for sender] Mapping for sender not found", "WARNING");
                        logger.warning("[Find for sender] Mapping for sender not found");
                    }                    
                })
            } else {

            }        
        
        res.render('disqualify_result', {title: 'Disqualify Result', mappingId: req.body.mappingId});

    }
};