'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

var TemplateQuestionConditional = new Schema({
    type: {type: String, required: true, trim: true},
    label: {type: Schema.Types.Mixed, required: true, trim: true},
    name: {type: String, required: true, trim: true},
    defaultValue: {type: String, required: false, trim: true},
    values: [{type: String, required: true, trim: true}],
    required: {type: Boolean, required: true, default: false},
    order: {type: Number, required: false, default: false},
    conditionalValue: {type: String, required: false, trim: true}
});

var TemplateQuestion = new Schema({
    type: {type: String, required: true, trim: true},
    label: {type: String, required: true, trim: true},
    name: {type: String, required: true, trim: true},
    defaultValue: {type: String, required: false, trim: true},
    values: [{type: String, required: true, trim: true}],
    required: {type: Boolean, required: true, default: false},
    order: {type: Number, required: false, default: false},
    childQuestions: [TemplateQuestionConditional],
    conditions: [{
        name: {type: String, required: false, trim: true},
        value: {type: String, required: false, trim: true},
    }]
});

var Template = new Schema({
    name: {type: String, required: true, trim: true},
    questions: [TemplateQuestion],
    createdAt: {type: Date, required: true, default: Date.now}
});

mongoose.model('Question', TemplateQuestion);
module.exports = mongoose.model('Template', Template);
