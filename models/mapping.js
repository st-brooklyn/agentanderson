var mongoose = require('mongoose');
var MappingSchema = new mongoose.Schema({    
    roomId: String,
    reservationId: String,
    customerId: String,
    customerDisplayName: String,
    conversationToken: String,
    createdDate: String,
    modifiedDate: String,
    originalMessage: String,
    replyMessage: String,
    fullMessage: String,
    action: String,
    apiPayload: Object,
    isSent: Boolean,
    recastUuid: String
});

mongoose.model('Mapping', MappingSchema);
module.exports = mongoose.model('Mapping');