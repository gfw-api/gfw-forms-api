'use strict';
const Router = require('koa-router');
const logger = require('logger');
const ErrorSerializer = require('serializers/errorSerializer');
const AnswersSerializer = require('serializers/answersSerializer');
const AnswersModel = require('models/answersModel');
const ReportsModel = require('models/reportsModel');
const s3Service = require('services/s3Service');
const passThrough = require('stream').PassThrough;
const json2csv = require('json2csv');
const ObjectId = require('mongoose').Types.ObjectId;

const router = new Router({
    prefix: '/reports/:reportId/answers'
});

class AnswersRouter {

    static * getAll() {
        logger.info(`Obtaining answers for report ${this.params.reportId}`);
        let filter = {
            $and: [{report: new ObjectId(this.params.reportId)}]
        };
        if (this.state.query) {
            Object.keys(this.state.query).forEach((key) => {
                let value;
                if (key === 'user') {
                    value = new ObjectId(this.state.query[key]);
                } else {
                    value = this.state.query[key];
                }
                filter.$and.push({ [key]: value });
            });
        }
        logger.debug(filter);
        const answers = yield AnswersModel.find(filter);
        this.body = AnswersSerializer.serialize(answers);
    }

    static * get() {
        logger.info(`Obtaining answer ${this.params.id} for report ${this.params.reportId}`);
        const answer = yield AnswersModel.find({
            user: this.state.loggedUser.id,
            _id: this.params.id,
            report: this.params.reportId
        });
        this.body = AnswersSerializer.serialize(answer);
    }

    static * save() {
        logger.info('Saving answer');
        logger.debug(this.request.body);

        const fields = this.request.body.fields;

        let answer = {
            report: this.params.reportId,
            areaOfInterest: fields.areaOfInterest,
            language: fields.language,
            userPosition: fields.userPosition.split(','),
            clickedPosition: fields.clickedPosition.split(','),
            timeFrame: fields.timeFrame.split(','),
            layer: fields.layer,
            user: this.state.loggedUser.id,
            responses: []
        };

        const pushResponse = (question, response) => {
            answer.responses.push({
                name: question.name,
                value: response
            });
        };

        const pushError = (question) => {
            this.throw(400, `${question.label[answer.language]} (${question.name}) required`);
            return;
        };

        const questions = this.state.report.questions;

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];

            // handle parent questions
            let response = this.request.body.fields[question.name] || this.request.body.files[question.name];
            if (!response && question.required) {
                pushError(question);
            }
            if (question.type === 'blob') {
                //upload file
                response = yield s3Service.uploadFile(response.path, response.name);
            }

            pushResponse(question, response);

            // handle child questions
            if (question.childQuestions) {
                for (let j = 0; j < question.childQuestions.length; j++) {
                    const childQuestion = question.childQuestions[j];
                    let response = this.request.body.fields[childQuestion.name] || this.request.body.files[childQuestion.name];
                    if (!response && question.required) {
                        pushError(childQuestion);
                    }
                    if (question.type === 'blob') {
                        //upload file
                        response = yield s3Service.uploadFile(response.path, response.name);
                    }
                    pushResponse(childQuestion, response);
                }
            }
        }

        const answerModel = yield new AnswersModel(answer).save();

        this.body = AnswersSerializer.serialize(answerModel);
    }

    static * update() {
        this.throw(500, 'Not implemented');
        return;
    }

    static * delete() {
        logger.info(`Deleting answer with id ${this.params.id}`);
        const result = yield AnswersModel.remove({
            _id: this.params.id,
            userId: this.state.loggedUser.id,
        });
        if (!result || !result.result || result.result.ok === 0) {
            this.throw(404, 'Answer not found');
            return;
        }
        this.body = '';
        this.statusCode = 204;
    }
}

function* loggedUserToState(next) {
    if (this.query && this.query.loggedUser) {
        this.state.loggedUser = JSON.parse(this.query.loggedUser);
        delete this.query.loggedUser;
    } else if (this.request.body && (this.request.body.loggedUser || (this.request.body.fields && this.request.body.fields.loggedUser))) {
        if (this.request.body.loggedUser) {
            this.state.loggedUser = this.request.body.loggedUser;
            delete this.request.body.loggedUser;
        } else if (this.request.body.fields && this.request.body.fields.loggedUser)  {
            this.state.loggedUser = JSON.parse(this.request.body.fields.loggedUser);
            delete this.request.body.fields.loggedUser;
        }
    } else {
        this.throw(401, 'Not logged');
        return;
    }
    yield next;
}

function * queryToState(next) {
    if (this.request.query && Object.keys(this.request.query).length > 0){
        this.state.query = this.request.query;
    }
    yield next;
}

function* checkExistReport(next) {
    const report = yield ReportsModel.findById(this.params.reportId).populate('questions');
    if (!report) {
        this.throw(404, 'Report not found');
        return;
    }
    this.state.report = report;
    yield next;
}


router.post('/', loggedUserToState, checkExistReport, AnswersRouter.save);
router.patch('/:id', loggedUserToState, checkExistReport, AnswersRouter.update);
router.get('/', loggedUserToState, queryToState, AnswersRouter.getAll);
router.get('/:id', loggedUserToState, queryToState, AnswersRouter.get);
router.delete('/:id', loggedUserToState, AnswersRouter.delete);

module.exports = router;