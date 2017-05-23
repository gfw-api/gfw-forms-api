'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

var AnswerResponse = new Schema({
    name: {type: String, required: true, trim: true},
    value: {type: String, required: true, trim: true},
});

var Answer = new Schema({
    report: {type: ObjectId, required: true},
    areaOfInterest: {type: String, required: true, trim: true},
    language: {type: String, required: true, trim: true},
    userPosition: {type: Array, required: false, default: []},
    clickedPosition: {type: Array, required: false, default: []},
    timeFrame: {type: Array, required: false, default: []},
    layer: {type: String, required: true, trim: true},
    user: {type: ObjectId, required: true},
    responses: [AnswerResponse],
    createdAt: {type: Date, required: true, default: Date.now}
});

module.exports = mongoose.model('Answer', Answer);
