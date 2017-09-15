const log = require('./logcontroller');

exports.disqualify_get = function(req, res, next) {
    res.render('disqualify_form', {title: 'Disqualify Form', mappingId: req.params.id});
};

exports.disqualify_post = function(req, res, next) {
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

    log.handleError(intent + " " + tourcode + "\n" + mappingId + "\n" + traveler + "\n" + departuredate + "\n" + returndate)
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

        // var rpoptions = {
        //     uri: configfile.apiUrl,
        //     qs: {
        //         apikey: 'APImushroomtravel',
        //         mode: 'loadproductchatbot',
        //         lang: 'th',
        //         pagesize: '1',
        //         pagenumber: '1',
        //         country_slug: country,
        //         startdate: departuredate,
        //         enddate: returndate,
        //         month: month,
        //         searchword: ""
        //     },
        //     headers: {
        //         'User-Agent': 'Request-Promise'
        //     },
        //     json: true // Automatically parses the JSON string in the response
        // };

        // rp(rpoptions)
        // .then((repos) => {
        //     log.handleError("[API Mockup] Repos: " + JSON.stringify(repos), "DEBUG");
        //     products = repos;
        //     requestSuccess = true;
        // })
        // .catch((error)=> {
        //     log.handleError('[Find to return api] ' + errupdate.stack, "ERROR");
        // });

        // while(requestSuccess == false)
        // {                            
        //     console.log("Krob: Mockup Products: NULL: Good night. " + requestSuccess + " " + timeout);
        //     require('deasync').sleep(500);
        //     timeout -= 500;

        //     if (requestSuccess == true || timeout == 0) {
        //         console.log("Mockup Products: ARRIVED!!!!!");
        //         break;
        //     }
        // }

        // const tpc = require('./templatecontroller');

        // if(products != null) {
        //     if(products.data.results > 0) {
        //         tpc.templateCarousel(products);
        //     }
        // }
        // else {

        // }        
        
        //res.render('disqualify_result', {title: 'Disqualify Result', mappingId: req.body.mappingId});

    }
};