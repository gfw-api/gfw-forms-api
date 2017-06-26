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


const router = new Router({
    prefix: '/reports'
});

class ReportsRouter {

    static * getAll(){
        logger.info('Obtaining all reports');
        let filter = {
            $and: [
                { $or: [{public: true}, {user: new ObjectId(this.state.loggedUser.id)}] }
            ]
        };
        if (this.state.query) {
            Object.keys(this.state.query).forEach((key) => {
                filter.$and.push({ [key]: this.state.query[key] });
            });
        }
        const reports = yield ReportsModel.find(filter);
        this.body = ReportsSerializer.serialize(reports);
    }

    static * get(){
        logger.info(`Obtaining reports with id ${this.params.id}`);
        const report = yield ReportsModel.find({
            $and: [
                { _id: this.params.id },
                { $or: [{public: true}, {user: new ObjectId(this.state.loggedUser.id)}] }
            ]
        });
        if (!report) {
            this.throw(404, 'Report not found with these permissions');
            return;
        }
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
            areaOfInterest: request.areaOfInterest,
            user: this.state.loggedUser.id,
            languages: request.languages,
            defaultLanguage: request.defaultLanguage,
            questions: request.questions,
            public: request.public
        }).save();
        this.body = ReportsSerializer.serialize(report);
    }

    static * update(){
        this.throw(500, 'Not implemented');
        return;
    }

    static * delete(){
        logger.info(`Deleting report with id ${this.params.id}`);
        const result = yield ReportsModel.remove({
            $and: [
                { _id: new ObjectId(this.params.id) },
                { $or: [{public: true}, {user: new ObjectId(this.state.loggedUser.id)}] }
            ]
        });
        if (!result || !result.result || result.result.ok === 0) {
            this.throw(404, 'Report not found with these permissions');
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

        for (let i = 0; i < report.questions.length; i++) {
            const question = report.questions[i];
            questions[question.name] = null;
            if (question.childQuestions){
                for (let j = 0, lengthChild = question.childQuestions.length; j < lengthChild; j++ ){
                    questions[question.childQuestions[j].name] = null;
                }
            }
        }

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
        logger.debug('Obtaining data');
        if (answers) {
            logger.debug('Data found!');
            let data = null;

            for (let i = 0, length = answers.length; i < length; i++) {
                const answer = answers[i];
                const responses = Object.assign({}, questions);
                for(let j = 0, lengthResponses = answer.responses.length; j < lengthResponses; j++){
                    const res = answer.responses[j];
                    responses[res.question.name] = res.answer.value;
                }
                logger.debug('Writting...');
                data = json2csv({
                    data: responses,
                    hasCSVColumnTitle: i === 0
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
    if (this.state.loggedUser.role === 'USER' || (this.state.loggedUser.role === 'MANAGER' && (!this.state.loggedUser.extraUserData || this.state.loggedUser.extraUserData.apps || this.state.loggedUser.extraUserData.apps.indexOf('gfw') === -1))) {
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
router.patch('/:id', loggedUserToState, checkPermission, ReportsValidator.update, ReportsRouter.update);
router.get('/', loggedUserToState, queryToState, ReportsRouter.getAll);
router.get('/:id', loggedUserToState, queryToState, ReportsRouter.get);
router.delete('/:id', loggedUserToState, checkPermission, ReportsRouter.delete);
router.get('/:id/download-answers', loggedUserToState, ReportsRouter.downloadAnswers);

module.exports = router;
