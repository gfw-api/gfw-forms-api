'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

var AnswerResponse = new Schema({
    name: {type: String, required: true, trim: true},
    value: {type: String, required: false, trim: true}
});

var Answer = new Schema({
    report: {type: ObjectId, required: true},
    username: {type: String, required: false, trim: true},
    organization: {type: String, required: false, trim: true},
    areaOfInterest: {type: String, required: false, trim: true},
    language: {type: String, required: true, trim: true},
    userPosition: {type: Array, required: false, default: []},
    clickedPosition: {type: Array, required: false, default: []},
    startDate: {type: String, required: false, trim: true},
    endDate: {type: String, required: false, trim: true},
    layer: {type: String, required: false, trim: true},
    user: {type: ObjectId, required: true},
    responses: [AnswerResponse],
    createdAt: {type: Date, required: true, default: Date.now}
});

module.exports = mongoose.model('Answer', Answer);
