'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

var QuestionConditional = new Schema({
    type: {type: String, required: true, trim: true},
    label: {type: Schema.Types.Mixed, required: true, trim: true},
    defaultValue: {type: String, required: false, trim: true},
    values: [{type: String, required: true, trim: true}],
    required: {type: Boolean, required: true, default: false},
    order: {type: Number, required: false, default: false},
    conditionalValue: {type: String, required: false, trim: true}
});

var Question = new Schema({
    type: {type: String, required: true, trim: true},
    label: {type: Schema.Types.Mixed, required: true, trim: true},
    defaultValue: {type: String, required: false, trim: true},
    values: [{type: String, required: true, trim: true}],
    required: {type: Boolean, required: true, default: false},
    order: {type: Number, required: false, default: false},
    conditionalQuestions: [QuestionConditional]
});

var Questionnaire = new Schema({
    name: {type: String, required: true, trim: true},
    questions: [Question],
    createdAt: {type: Date, required: true, default: Date.now}
});

mongoose.model('Question', Question);
module.exports = mongoose.model('Questionnaire', Questionnaire);
