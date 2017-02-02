'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

var Response = new Schema({
    questionnaire: { type: ObjectId, ref: 'Questionnaire', required: true }, 
    user: {type: ObjectId, required: true},
    responses: [{
        question: { type: ObjectId, ref: 'Question', required: true },
        value: {type: String, required: true, trim: true}
    }],
    createdAt: {type: Date, required: true, default: Date.now}
});


module.exports = mongoose.model('Response', Response);
