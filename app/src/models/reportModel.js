'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

var QuestionResponse = new Schema({
    name: {type: String, required: true, trim: true},
    label: {type: String, required: true, trim: true}
});

var AnswerResponse = new Schema({
    value: {type: String, required: true, trim: true},
    label: {type: String, required: true, trim: true}
});

var Report = new Schema({
    templateId: { type: ObjectId, ref: 'Template', required: true },
    areaOfInterest: {type: String, required: true, trim: true},
    language: {type: String, required: true, trim: true},
    userPosition: {type: Array, required: true, default: false},
    clickedPosition: {type: Array, required: false, default: false},
    timeFrame: {type: Array, required: false, default: false},
    layerSelected: {type: String, required: true, trim: true},
    user: {type: ObjectId, required: true},
    responses: [{
        question: QuestionResponse,
        answer: AnswerResponse
    }],
    createdAt: {type: Date, required: true, default: Date.now}
});

module.exports = mongoose.model('Report', Report);
