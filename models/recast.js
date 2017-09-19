var mongoose = require('mongoose');
var RecastResultSchema = new mongoose.Schema({
    mappingId: String,
    responseMessage: String,
    createdDate: String,
    modifiedDate: String
});

mongoose.model('recastresult', RecastResultSchema);
module.exports = mongoose.model('recastresult');