const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema;

const QuestionConditional = new Schema({
    type: { type: String, required: true, trim: true },
    label: { type: Schema.Types.Mixed, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    defaultValue: { type: String, required: false, trim: true },
    values: [{ type: String, required: true, trim: true }],
    required: { type: Boolean, required: true, default: false },
    order: { type: Number, required: false, default: false },
    conditionalValue: { type: String, required: false, trim: true }
});

const Question = new Schema({
    type: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    defaultValue: { type: String, required: false, trim: true },
    values: [{ type: String, required: true, trim: true }],
    required: { type: Boolean, required: true, default: false },
    order: { type: Number, required: false, default: false },
    childQuestions: [QuestionConditional],
    conditions: [{
        name: { type: String, required: false, trim: true },
        value: { type: String, required: false, trim: true },
    }]
});

const Questionnaire = new Schema({
    name: { type: String, required: true, trim: true },
    questions: [Question],
    createdAt: { type: Date, required: true, default: Date.now }
});

mongoose.model('Question', Question);
module.exports = mongoose.model('Questionnaire', Questionnaire);
