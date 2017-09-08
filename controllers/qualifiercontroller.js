var Mapping = require('../models/mapping');

exports.disqualify_get = function(req, res, next) {
    var id = req.params.id;

    console.log("[DisQualifier ID] => " + id);
    Mapping.findById(id)
    .then((foundone) => {
        // get the message and send back to the room
        console.log("Found: " + JSON.stringify(foundone));
        var roomId = foundone.roomId;
        var reply = foundone.replyMessage;

        // send message to room
        lineclient.pushMessage(roomId, JSON.parse(reply))
        Mapping.findByIdAndUpdate(id, 
            {$set: {action: "NO"}}, 
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
    res.render('disqualify_form', {title: 'Disqualify Form', mappingId: req.params.id});
};

exports.disqualify_post = function(req, res, next) {
    // Perform validation here form the submitted form data
    // req.body.<field_name>

    var hasError = false;

    // Check if Mapping Id is passed
    //req.checkBody('mappingId', 'No mapping ID found').notEmpty();
    console.log("Mapping ID: " + req.body.mappinId);

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

        res.render('disqualify_result', {title: 'Disqualify Result', mappingId: req.body.mappingId});
    }
};