'use strict';
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Express' });
});

router.post('/getmessage', function (req, res) {
    // Extract message
    // Make a request to AI

    //var request = require('request');

    //var options = {
    //    uri: 'https://www.googleapis.com/urlshortener/v1/url',
    //    method: 'POST',
    //    json: {
    //        "longUrl": "http://www.google.com/"
    //    }
    //};

    //request(options, function (error, response, body) {
    //    if (!error && response.statusCode == 200) {
    //        console.log(body.id) // Print the shortened url.
    //    }
    //});

    // Send a post request back to line

});

module.exports = router;
