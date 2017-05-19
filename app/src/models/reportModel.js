'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

var QuestionResponse = new Schema({
    name: {type: String, required: true, trim: true},
    label: {type: String, required: true, trim: true},
    level: {type: String, required: false, trim: true}
});

var AnswerResponse = new Schema({
    value: {type: String, required: true, trim: true},
    label: {type: String, required: false, trim: true}
});

var Report = new Schema({
    template: {type: String, required: true, trim: true},
    areaOfInterest: {type: String, required: true, trim: true},
    language: {type: String, required: true, trim: true},
    userPosition: {type: Array, required: false, default: []},
    clickedPosition: {type: Array, required: false, default: []},
    timeFrame: {type: Array, required: false, default: []},
    layer: {type: String, required: true, trim: true},
    user: {type: String, required: true, trim: true},
    responses: [{
        question: QuestionResponse,
        answer: AnswerResponse
    }],
    createdAt: {type: Date, required: true, default: Date.now}
});

module.exports = mongoose.model('Report', Report);
