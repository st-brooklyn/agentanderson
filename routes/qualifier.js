
'use strict';
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/qualify/{id}', function (req, res) {
    //res.render('index', { title: 'Express' });
    // Forward message to the room
});

router.get('/disqualify/{id}', function(req, res) {
    // Update the database that this is not correct
    
});


module.exports = router;
