'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

var TemplateQuestionConditional = new Schema({
    type: {type: String, required: true, trim: true},
    label: {type: Schema.Types.Mixed, required: true, trim: true},
    name: {type: String, required: true, trim: true},
    defaultValue: {type: Object, required: false, trim: true},
    values: [{type: Object, required: true, trim: true}],
    required: {type: Boolean, required: true, default: false},
    order: {type: Number, required: false, default: false},
    conditionalValue: {type: Object, required: false, trim: true}
});

var TemplateQuestion = new Schema({
    type: {type: String, required: true, trim: true},
    label: {type: Object, required: true, trim: true},
    name: {type: String, required: true, trim: true},
    defaultValue: {type: Object, required: false, trim: true},
    values: [{type: Object, required: true, trim: true}],
    required: {type: Boolean, required: true, default: false},
    order: {type: Number, required: false, default: false},
    childQuestions: [TemplateQuestionConditional],
    conditions: [{
        name: {type: String, required: false, trim: true},
        value: {type: String, required: false, trim: true}
    }]
});

var Template = new Schema({
    name: {type: Object, required: true, trim: true},
    areaOfInterest: {type: String, required: true, trim: true},
    user: {type: String, required: true, trim: true},
    languages: {type: Array, required: true, trim: true},
    defaultLanguage: {type: String, required: true, trim: true},
    createdAt: {type: Date, required: true, default: Date.now},
    questions: [TemplateQuestion]
});

mongoose.model('TemplateQuestion', TemplateQuestion);
module.exports = mongoose.model('Template', Template);
