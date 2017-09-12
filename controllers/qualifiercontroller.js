exports.disqualify_get = function(req, res, next) {
    res.render('disqualify_form', {title: 'Disqualify Form', mappingId: req.params.id});
};

exports.disqualify_post = function(req, res, next) {
    // Perform validation here form the submitted form data
    // req.body.<field_name>

    var hasError = false;

    // Check if Mapping Id is passed
    //req.checkBody('mappingId', 'No mapping ID found').notEmpty();
    console.log("Mapping ID: " + req.body.mappingId);
    console.log("Country Name: " + req.body.country);
    console.log("Product Code: " + req.body.code);    
 
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