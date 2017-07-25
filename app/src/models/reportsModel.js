'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

var ReportsQuestionConditional = new Schema({
    type: {type: String, required: true, trim: true},
    label: {type: Schema.Types.Mixed, required: true, default: {}},
    name: {type: String, required: true, trim: true},
    defaultValue: {type: Schema.Types.Mixed, required: false, trim: true},
    values: {type: Schema.Types.Mixed, required: true, default: {}},
    required: {type: Boolean, required: true, default: false},
    order: {type: Number, required: false, default: false},
    conditionalValue: {type: Number, required: false, trim: true}
});

var ReportsQuestion = new Schema({
    type: {type: String, required: true, trim: true},
    label: {type: Schema.Types.Mixed, required: true, default: {}},
    name: {type: String, required: true, trim: true},
    defaultValue: {type: Schema.Types.Mixed, required: false, trim: true},
    values: {type: Schema.Types.Mixed, required: true, default: {}},
    required: {type: Boolean, required: true, default: false},
    order: {type: Number, required: false, default: false},
    childQuestions: [ReportsQuestionConditional],
    conditions: [{
        name: {type: String, required: false, trim: true},
        value: {type: Number, required: false, trim: true}
    }]
});

var Report = new Schema({
    name: {type: Schema.Types.Mixed, required: true, default: {}},
    user: {type: ObjectId, required: true},
    languages: {type: Array, required: true, default: false},
    defaultLanguage: {type: String, required: true, trim: true},
    public: {type: Boolean, required: true, default: false},
    createdAt: {type: Date, required: true, default: Date.now},
    status: {type: String, required: true, trim: true, default: 'unpublished'},
    questions: [ReportsQuestion]
});

mongoose.model('ReportsQuestion', ReportsQuestion);
module.exports = mongoose.model('Report', Report);
