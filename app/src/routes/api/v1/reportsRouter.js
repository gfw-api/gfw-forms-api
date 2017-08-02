'use strict';
const Router = require('koa-router');
const logger = require('logger');
const ErrorSerializer = require('serializers/errorSerializer');
const ReportsSerializer = require('serializers/reportsSerializer');
const ReportsModel = require('models/reportsModel');
const ReportsValidator = require('validators/reportsValidator');
const AnswersModel = require('models/answersModel');
const passThrough = require('stream').PassThrough;
const json2csv = require('json2csv');
const ObjectId = require('mongoose').Types.ObjectId;
const ctRegisterMicroservice = require('ct-register-microservice-node');


const router = new Router({
    prefix: '/reports'
});

class ReportsRouter {

    static * getAll(){
        logger.info('Obtaining all reports');
        let filter = {
            $and: [
                { $or: [{
                    $and: [ {public: true}, {status: 'published'} ]},
                    {user: new ObjectId(this.state.loggedUser.id)}]
                }
            ]
        };
        if (this.state.query) {
            Object.keys(this.state.query).forEach((key) => {
                filter.$and.push({ [key]: this.state.query[key] });
            });
        }
        const reports = yield ReportsModel.find(filter);
        
        // get answer count for each report
        const numReports = reports.length;
        for (let i = 1; i < numReports; i++) {
            let answersFilter = {};
            if (this.state.loggedUser.role === 'ADMIN' || this.state.loggedUser.id === reports[i].user) {
                answersFilter = {
                    report: new ObjectId(reports[i].id)
                };
            } else {
                answersFilter = {
                    user: new ObjectId(this.state.loggedUser.id),
                    report: new ObjectId(this.params.id)
                };
            }
            const answers = yield AnswersModel.count(answersFilter);
            logger.info(answers);
            reports[i].answersCount = answers || 0;
        }

        this.body = ReportsSerializer.serialize(reports);
    }

    static * get(){
        logger.info(`Obtaining reports with id ${this.params.id}`);
        const report = yield ReportsModel.findOne({ _id: this.params.id });
        if (!report) {
            this.throw(404, 'Report not found with these permissions');
            return;
        }

        // get answers count for the report
        let answersFilter = {};
        if (this.state.loggedUser.role === 'ADMIN' || this.state.loggedUser.id === report.user) {
            answersFilter = {
                report: new ObjectId(this.params.id)
            };
        } else {
            answersFilter = {
                user: new ObjectId(this.state.loggedUser.id),
                report: new ObjectId(this.params.id)
            };
        }
        const answers = yield AnswersModel.count(answersFilter);
        report.answersCount = answers;
        
        this.body = ReportsSerializer.serialize(report);
    }

    static * save(){
        logger.info('Saving reports', this.request.body);
        const request = this.request.body;

        if (request.public && this.state.loggedUser.role !== 'ADMIN') {
            this.throw(404, 'Admin permissions required to save public templates');
            return;
        }

        const report = yield new ReportsModel({
            name: request.name,
            user: this.state.loggedUser.id,
            languages: request.languages,
            defaultLanguage: request.defaultLanguage,
            questions: request.questions,
            public: request.public,
            status: request.status
        }).save();

        // PATCH templateId onto area
        // Remove report if PATCH fails
        if (request.areaOfInterest) {
            const reportId = report._id.toString();
            try {
                const result = yield ctRegisterMicroservice.requestToMicroservice({
                    uri: `/v1/area/${request.areaOfInterest}`,
                    method: 'PATCH',
                    json: true,
                    body: {
                        templateId: reportId,
                        userId: this.state.loggedUser.id
                    }
                });
            } catch (e) {
                const result = yield ReportsModel.remove({ _id: reportId });
                logger.error(e);
                this.throw(500, 'Error creating templates: patch to area failed');
            }
        }

        this.body = ReportsSerializer.serialize(report);
    }

    static * update(){
        logger.info(`Updating template with id ${this.params.id}...`);
        const reportFilter = {
            $and: [
                { _id: new ObjectId(this.params.id) },
                { user: new ObjectId(this.state.loggedUser.id) }
            ]
        };
        const report = yield ReportsModel.findOne(reportFilter);
        const request = this.request.body;

        // if user did not create then return error
        if (!report) {
            this.throw(404, 'Report not found with these permissions');
            return;
        }

        // props allow to change even with answers
        if (request.name) {
            report.name = request.name;
        }
        if (request.status) {
            report.status = request.status;
        }
        if (request.languages) {
            report.languages = request.languages;
        }

        // if user is an admin, they can make the report public
        if (this.state.loggedUser.role === 'ADMIN' && request.public) {
            report.public = request.public;
        }

        // PATCH templateId onto area
        // Remove report if PATCH fails
        if (request.areaOfInterest !== request.oldAreaOfInterest) {

            // remove old area
            if (request.oldAreaOfInterest) {
                logger.info(`PATCHing old area of interes ${request.oldAreaOfInterest}...`);
                try {
                    const result = yield ctRegisterMicroservice.requestToMicroservice({
                        uri: `/v1/area/${request.oldAreaOfInterest}`,
                        method: 'PATCH',
                        json: true,
                        body: {
                            templateId: null,
                            userId: this.state.loggedUser.id
                        }
                    });
                } catch (e) {
                    logger.error(e);
                    this.throw(500, 'PATCHing old area failed');
                }
            }
            
            // PATCH new area
            if (request.areaOfInterest) {
                logger.info(`PATCHing new area of interes ${request.oldAreaOfInterest}...`);
                try {
                    const result = yield ctRegisterMicroservice.requestToMicroservice({
                        uri: `/v1/area/${request.areaOfInterest}`,
                        method: 'PATCH',
                        json: true,
                        body: {
                            templateId: this.params.id,
                            userId: this.state.loggedUser.id
                        }
                    });
                } catch (e) {
                    logger.error(e);
                    this.throw(500, 'PATCHing new area failed');
                }
            }
        }

        if (request.areaOfInterest) {

        }

        // add answers count to return and updated date
        const answers = yield AnswersModel.count({report: new ObjectId(this.params.id)});        
        report.answersCount = answers;
        report.updatedDate = Date.now;

        yield report.save();
        this.body = ReportsSerializer.serialize(report);
    }

    static * delete(){
        const aoi = this.state.query && this.state.query.aoi !== null ? this.state.query.aoi.split(',') : null;
        logger.info(`Checking report for answers...`);
        const answers = yield AnswersModel.count({report: new ObjectId(this.params.id)});
        if (answers.length > 0) {
            this.throw(403, 'This report has answers, you cannot delete. Please unpublish instead.');
        }
        logger.info(`Report has no answers.`);
        logger.info(`Deleting report with id ${this.params.id}...`);
        if (aoi !== null) {
            for (let i = 0; i < aoi.length; i++) {
                logger.debug(aoi[i]);
                logger.info(`PATCHing area ${aoi[i]} to remove template association...`);
                try {
                    const result = yield ctRegisterMicroservice.requestToMicroservice({
                        uri: `/v1/area/${aoi[i]}`,
                        method: 'PATCH',
                        json: true,
                        body: {
                            templateId: null,
                            userId: this.state.loggedUser.id
                        }
                    });
                    logger.info(`Area ${aoi[i]} patched.`);
                } catch (e) {
                    logger.error(e);
                    this.throw(500, e);
                }
            }
            logger.info('Areas patched. Remvoing template...');
        }

        // finally remove template
        const result = yield ReportsModel.remove({
            $and: [
                { _id: new ObjectId(this.params.id) },
                { user: new ObjectId(this.state.loggedUser.id) },
                { status: ['draft', 'unpublished'] }
            ]
        });

        if (!result || !result.result || result.result.ok === 0) {
            this.throw(404, 'Report not found with these permissions. You must be the owner to remove.');
            return;
        }
        this.body = '';
        this.statusCode = 204;
    }

    static * downloadAnswers() {
        logger.info(`Downloading answers for report ${this.params.id}`);
        this.set('Content-disposition', `attachment; filename=${this.params.id}.csv`);
        this.set('Content-type', 'text/csv');
        this.body = passThrough();

        const report = yield ReportsModel.findOne({
            $and: [
                { _id: new ObjectId(this.params.id) },
                { $or: [{public: true}, {user: new ObjectId(this.state.loggedUser.id)}] }
            ]
        });

        if (!report) {
            this.throw(404, 'Report not found with these permissions');
            return;
        }

        const questions = {};
        const questionLabels = {};

        for (let i = 0; i < report.questions.length; i++) {
            const question = report.questions[i];
            questions[question.name] = '';
            if (question.childQuestions){
                for (let j = 0, lengthChild = question.childQuestions.length; j < lengthChild; j++ ){
                    questions[question.childQuestions[j].name] = '';
                }
            }
        }

        for (let i = 0; i < report.questions.length; i++) {
            const question = report.questions[i];
            questionLabels[question.name] = question.label[report.defaultLanguage];
            if (question.childQuestions){
                for (let j = 0, lengthChild = question.childQuestions.length; j < lengthChild; j++ ){
                    questionLabels[question.childQuestions[j].name] = question.childQuestions[j].label[report.defaultLanguage];
                }
            }
        }

        const questionLabelsData = json2csv({
            data: questionLabels
        }) + '\n';
        this.body.write(questionLabelsData);

        let filter = {};
        if (this.state.loggedUser.role === 'ADMIN') {
            filter = { report: this.params.id };
        } else {
            filter = {
                $and: [
                    { report: new ObjectId(this.params.id) },
                    { user: new ObjectId(this.state.loggedUser.id) }
                ]
            };
        }

        const answers = yield AnswersModel.find(filter);
        logger.info('Obtaining data');
        if (answers) {
            logger.info('Data found!');
            let data = null;
            for (let i = 0, length = answers.length; i < length; i++) {
                const answer = answers[i].toObject();
                const responses = Object.assign({}, questions);
                for (let j = 0, lengthResponses = answer.responses.length; j < lengthResponses; j++){
                    const res = answer.responses[j];
                    const reportQuestions = report.questions;
                    let activeQuestion = {};
                    for (let k = 0; k < reportQuestions.length; k ++) {
                        if (reportQuestions[k].name && reportQuestions[k].name === res.question.name) {
                            activeQuestion = reportQuestions[k];
                        }
                    }
                    if (( activeQuestion.type === 'checkbox' || activeQuestion.type === 'radio' || activeQuestion.type === 'select' ) && typeof res.answer.value === 'number') {
                        let activeValue = {};
                        for (let x = 0; x < activeQuestion.values[report.defaultLanguage].length; x ++) {
                            if (activeQuestion.values[report.defaultLanguage][x].value === res.answer.value) {
                                activeValue = activeQuestion.values[report.defaultLanguage][x];
                            }
                        }
                        responses[res.question.name] = activeValue.label;
                    } else {
                        responses[res.question.name] = res.answer.value;
                    }
                }
                logger.info('Writting...');
                data = json2csv({
                    data: responses,
                    hasCSVColumnTitle: false
                }) + '\n';
                this.body.write(data);
            }
        } else {
            this.throw(404, 'No data found');
            return;
        }
        this.body.end();
    }
}

function * loggedUserToState(next) {
    if (this.query && this.query.loggedUser){
        this.state.loggedUser = JSON.parse(this.query.loggedUser);
        delete this.query.loggedUser;
    } else if (this.request.body && this.request.body.loggedUser) {
        this.state.loggedUser = this.request.body.loggedUser;
        delete this.request.body.loggedUser;
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

function * checkPermission(next) {
    if (this.state.loggedUser.role === 'MANAGER' && (!this.state.loggedUser.extraUserData || this.state.loggedUser.extraUserData.apps || this.state.loggedUser.extraUserData.apps.indexOf('gfw') === -1)) {
        this.throw(403, 'Not authorized');
        return;
    }
    yield next;
}

function* checkAdmin(next) {
    if (!this.state.loggedUser || this.state.loggedUser.role === 'ADMIN') {
        this.throw(403, 'Not authorized');
        return;
    }
    yield next;
}

// check permission must be added at some point
router.post('/', loggedUserToState, ReportsValidator.create, ReportsRouter.save);
router.patch('/:id', loggedUserToState, ReportsValidator.update, ReportsRouter.update);
router.get('/', loggedUserToState, queryToState, ReportsRouter.getAll);
router.get('/:id', loggedUserToState, queryToState, ReportsRouter.get);
router.delete('/:id', loggedUserToState, queryToState, ReportsRouter.delete);
router.get('/:id/download-answers', loggedUserToState, ReportsRouter.downloadAnswers);

module.exports = router;
