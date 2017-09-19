var mongoose = require('mongoose');
var RecastResultSchema = new mongoose.Schema({
    mappingId: String,
    responseMessage: String,
    createdDate: String,
    modifiedDate: String
});

mongoose.model('recastresults', RecastResultSchema);
module.exports = mongoose.model('RecastResult');