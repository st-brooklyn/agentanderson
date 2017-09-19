var mongoose = require('mongoose');
var ConfirmationResultSchema = new mongoose.Schema({
    mappingId: String,
    message: String,
    reservationId: String,
    result:Boolean,
    apiPayload: Object,
    createdDate: String,
    modifiedDate: String
});

mongoose.model('confirmationresult', RecastResultSchema);
module.exports = mongoose.model('confirmationresult');