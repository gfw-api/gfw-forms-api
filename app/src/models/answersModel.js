const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema;

const AnswerResponse = new Schema({
    name: { type: String, required: true, trim: true },
    value: { type: String, required: false, trim: true }
});

const Answer = new Schema({
    report: { type: ObjectId, required: true },
    reportName: { type: String, required: true },
    username: { type: String, required: false, trim: true },
    organization: { type: String, required: false, trim: true },
    areaOfInterest: { type: ObjectId, required: false },
    areaOfInterestName: { type: String, required: false, trim: true },
    language: { type: String, required: true, trim: true },
    userPosition: { type: Array, required: false, default: [] },
    clickedPosition: { type: Array, required: false, default: [] },
    startDate: { type: String, required: false, trim: true },
    endDate: { type: String, required: false, trim: true },
    layer: { type: String, required: false, trim: true },
    user: { type: ObjectId, required: true },
    responses: [AnswerResponse],
    createdAt: { type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('Answer', Answer);
