'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Question = new Schema({
    type: {type: String, required: true, trim: true},
    label: {type: String, required: true, trim: true},
    defaultValue: {type: String, required: false, trim: true},
    values: [{type: String, required: true, trim: true}],
    required: {type: Boolean, required: true, default: false}
});

var Questionnaire = new Schema({
    name: {type: String, required: true, trim: true},
    questions: [Question],
    createdAt: {type: Date, required: true, default: Date.now}
});

mongoose.model('Question', Question);
module.exports = mongoose.model('Questionnaire', Questionnaire);
