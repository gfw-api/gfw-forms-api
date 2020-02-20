const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema;

const Response = new Schema({
    questionnaire: { type: ObjectId, ref: 'Questionnaire', required: true },
    user: { type: ObjectId, required: true },
    responses: [{
        question: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true }
    }],
    createdAt: { type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('Response', Response);
