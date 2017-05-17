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
            template: this.params.template,
            _id: this.params.id
        });
        this.body = ReportSerializer.serialize(report);
    }

    static * save() {
        logger.info('Saving report');
        logger.debug(this.request.body);

        let report = {
            user: this.state.loggedUser.id,
            template: this.state.template._id,
            responses: []
        };

        for (let i = 0, length = this.state.template.questions.length; i < length; i++) {
            const question = this.state.template.questions[i];
            let response = null;
            if (question.conditionalQuestions) {
                for (let j = 0, lengthSub = question.conditionalQuestions.length; j < lengthSub; j++) {
                    response = this.request.body.fields[question.conditionalQuestions[j].name] || this.request.body.files[question.conditionalQuestions[j].name];
                    if (!response && question.conditionalQuestions[j].required) {
                        this.throw(400, `${question.label} (${question.name}) required`);
                        return;
                    }
                    if (response) {
                        if (question.type === 'blob') {
                            //upload file
                            response = yield s3Service.uploadFile(response.path, response.name);
                        }
                        report.responses.push({
                            question: question.conditionalQuestions[j].name,
                            value: response
                        });
                    }
                }
            }
            response = this.request.body.fields[question.name] || this.request.body.files[question.name];
            if (!response && question.required) {
                this.throw(400, `${question.label} (${question.name}) required`);
                return;
            }
            if (response) {
                if (question.type === 'blob') {
                    //upload file
                    response = yield s3Service.uploadFile(response.path, response.name);
                }
                report.responses.push({
                    question: question.name,
                    value: response
                });
            }
        }

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
            template: this.params.template,
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
    logger.debug(this.request.body.fields.template);
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
router.get('/:id', loggedUserToState, checkExistTemplate, ReportRouter.get);
router.delete('/:id', loggedUserToState, checkExistTemplate, ReportRouter.delete);



module.exports = router;
