'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

var Report = new Schema({
    template: { type: ObjectId, ref: 'Template', required: true },
    user: {type: ObjectId, required: true},
    responses: [{
        question: {type: String, required: true, trim: true},
        value: {type: String, required: true, trim: true}
    }],
    createdAt: {type: Date, required: true, default: Date.now}
});


module.exports = mongoose.model('Report', Report);
