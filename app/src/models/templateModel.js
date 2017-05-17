'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

var TemplateQuestionConditional = new Schema({
    type: {type: String, required: true, trim: true},
    label: {type: Object, required: true, default: {}},
    name: {type: String, required: true, trim: true},
    defaultValue: {type: Schema.Types.Mixed, required: false, trim: true},
    values: [{type: Object, required: true, default: {}}],
    required: {type: Boolean, required: true, default: false},
    order: {type: Number, required: false, default: false},
    conditionalValue: {type: Number, required: false, trim: true}
});

var TemplateQuestion = new Schema({
    type: {type: String, required: true, trim: true},
    label: {type: Object, required: true, default: {}},
    name: {type: String, required: true, trim: true},
    defaultValue: {type: Schema.Types.Mixed, required: false, trim: true},
    values: [{type: Object, required: true, default: {}}],
    required: {type: Boolean, required: true, default: false},
    order: {type: Number, required: false, default: false},
    childQuestions: [TemplateQuestionConditional],
    conditions: [{
        name: {type: String, required: false, trim: true},
        value: {type: Number, required: false, trim: true}
    }]
});

var Template = new Schema({
    name: {type: Object, required: true, default: {}},
    areaOfInterest: {type: String, required: true, trim: true},
    user: {type: String, required: true, trim: true},
    languages: {type: Array, required: true, default: false},
    defaultLanguage: {type: String, required: true, trim: true},
    createdAt: {type: Date, required: true, default: Date.now},
    questions: [TemplateQuestion]
});

mongoose.model('TemplateQuestion', TemplateQuestion);
module.exports = mongoose.model('Template', Template);
