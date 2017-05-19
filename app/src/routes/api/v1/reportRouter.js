'use strict';
const Router = require('koa-router');
const logger = require('logger');
const ErrorSerializer = require('serializers/errorSerializer');
const ReportSerializer = require('serializers/reportSerializer');
const ReportModel = require('models/reportModel');
const TemplateModel = require('models/templateModel');
const s3Service = require('services/s3Service');

const router = new Router({
    prefix: '/report',
});

class ReportRouter {

    static * getAll() {
        logger.info('Obtaining all report');
        const reports = yield ReportModel.find({
            user: this.state.loggedUser.id
        });
        this.body = ReportSerializer.serialize(reports);
    }

    static * get() {
        logger.info(`Obtaining reports with id ${this.params.id}`);
        const report = yield ReportModel.find({
            user: this.state.loggedUser.id,
            _id: this.params.id
        });
        this.body = ReportSerializer.serialize(report);
    }

    static * save() {
        logger.info('Saving report');
        logger.debug(this.request.body);

        const fields = this.request.body.fields;

        let report = {
            template: fields.template,
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
            report.responses.push({
                question: {
                    name: question.name,
                    label: question.label[report.language],
                    level: question.level
                },
                answer: {
                    value: response
                }
            });
        };

        const pushError = (question) => {
            this.throw(400, `${question.label[report.language]} (${question.name}) required`);
            return;
        };

        const questions = this.state.template.questions;

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
                for (let j = 0; j < question.childQuestions; j++) {
                    const childQuestion = questions.childQuestions[j];
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

        logger.debug(report);

        const reportModel = yield new ReportModel(report).save();

        this.body = ReportSerializer.serialize(reportModel);
    }

    static * update() {
        this.throw(500, 'Not implemented');
        return;
    }

    static * delete() {
        logger.info(`Deleting report with id ${this.params.id}`);
        const result = yield ReportModel.remove({
            _id: this.params.id,
            userId: this.state.loggedUser.id,
        });
        if (!result || !result.result || result.result.ok === 0) {
            this.throw(404, 'Report not found');
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

function* checkExistTemplate(next) {
    const template = yield TemplateModel.findById(this.request.body.fields.template).populate('questions');
    if (!template) {
        this.throw(404, 'Template not found');
        return;
    }
    this.state.template = template;
    yield next;
}

router.post('/', loggedUserToState, checkExistTemplate, ReportRouter.save);
router.patch('/:id', loggedUserToState, checkExistTemplate, ReportRouter.update);
router.get('/', loggedUserToState, ReportRouter.getAll);
router.get('/:id', loggedUserToState, ReportRouter.get);
router.delete('/:id', loggedUserToState, ReportRouter.delete);


module.exports = router;
