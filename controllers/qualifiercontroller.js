const logger = require('./logcontroller');
const Mapping = require('../models/mapping');


exports.qualify_get = function(id){
    logger.debug("[Qualify]", {mappingId: id});

    Mapping.findById(id)
    .then((foundone) => {
        // get the message and send back to the room
        logger.silly("[Qualify] Found a mapping.", foundone);        
        var roomId = foundone.roomId;
        var reply = foundone.replyMessage;

        // send message to room
        var lineclient = new require('@line/bot-sdk').Client(config);
        lineclient.pushMessage(roomId, JSON.parse(reply))
        Mapping.findByIdAndUpdate(id, 
            {$set: {action: "YES"}}, 
            {new: true})
        .then(() => {
            logger.debug("[Push after qualify] Message sent");            
        })
        .catch((pushError) => {
            logger.error('[Push after qualify]', pushError);            
        });
    })
    .catch((finderror) => {
        logger.error("[Find one for Qualification]", finderror);        
    });
};

exports.disqualify_get = function(req, res, next) {
    res.render('disqualify_form', {title: 'Disqualify Form', mappingId: req.params.id});
};

exports.disqualify_post = function(req, res, next) {
    //const log = require('./logcontroller');
    const messages = [];    
    // Perform validation here form the submitted form data
    // req.body.<field_name>

    var hasError = false;

    console.log("Payload: " + JSON.stringify(req.body));

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

     logger.debug(intent + " " + tourcode + "\n" + mappingId + "\n" + traveler + "\n" + departuredate + "\n" + returndate, "DEBUG")
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

        const rp = require('request-promise');

        var rpoptions = {
            uri: configfile.apiUrl,
            qs: {
                apikey: 'APImushroomtravel',
                mode: 'loadproductchatbot',
                lang: 'th',
                pagesize: '1',
                pagenumber: '1',
                country_slug: country,
                startdate: departuredate,
                enddate: returndate,
                month: month,
                searchword: tourcode
            },
            headers: {
                'User-Agent': 'Request-Promise'
            },
            json: true // Automatically parses the JSON string in the response
        };

        rp(rpoptions)
        .then((repos) => {
            logger.debug("[API Mockup] Repos: ", {repos: repos});
            products = repos;
            requestSuccess = true;
        })
        .catch((error)=> {
            logger.error('[Find to return api] ', {error: errupdate.stack});
        });

        while(requestSuccess == false)
        {                            
            console.log("Krob: Mockup Products: NULL: Good night. " + requestSuccess + " " + timeout);
            require('deasync').sleep(500);
            timeout -= 500;

            if (requestSuccess == true || timeout == 0) {
                console.log("Mockup Products: ARRIVED!!!!!");
                break;
            }
        }

        const tpc = require('./templatecontroller');

        if(products != null) {
            if(products.data.results > 0) {
                tpc.templateCarousel(products);
                var reply_carousel = tpc.templateCarousel(products);
                var reply_confirm = tpc.templateConfirm(mappingId, '');
                messages.push(reply_carousel);
                messages.push(reply_confirm);
            }

            Mapping.findById(mappingId)
                .then((senderMapping) => {
                    if(senderMapping) {
                        senderId = senderMapping.userId;
                        //handleError("[Find for sender] Sender Id: " + senderId, "DEBUG");
                        logger.debug("[Find for sender]", {senderId: senderId});
                        
                        lineclient.pushMessage(senderId, messages)
                        .then(() => {
                            // process after push message to Line
                            //handleError("[Push carousel] Carousel sent to the sender.", "DEBUG");
                            logger.debug("[Push messages] Carousel sent to the sender");
                            if (reply_carousel == null){
                                Mapping.findByIdAndUpdate(mappingId, 
                                    {$set: {replyMessage: JSON.stringify(replyToClient)}},
                                    {new: true})
                                .then((mappingUpdateReply) => {                                
                                    //handleError("[Find to update reply] Updated response mapping: " + mappingUpdateReply, "DEBUG");
                                    logger.debug("[Find to update reply]", {mappingUpdateReply: mappingUpdateReply});
                                })
                                .catch((errupdate) => {
                                    //handleError('[Find to update reply] ' + errupdate.stack, "ERROR");
                                    logger.error("[Find to update reply]", {stack: errupdate.stack});
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
        }
        else {

        }        
        
        res.render('disqualify_result', {title: 'Disqualify Result', mappingId: req.body.mappingId});

    }
};