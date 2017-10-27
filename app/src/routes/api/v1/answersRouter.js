'use strict';
const Router = require('koa-router');
const logger = require('logger');
const AnswersSerializer = require('serializers/answersSerializer');
const AnswersModel = require('models/answersModel');
const AnswersService = require('services/answersService');
const TeamService = require('services/teamService');
const ReportsModel = require('models/reportsModel');
const s3Service = require('services/s3Service');
const ObjectId = require('mongoose').Types.ObjectId;

const router = new Router({
    prefix: '/reports/:reportId/answers'
});

class AnswersRouter {

    static * getAll() {
        logger.info(`Obtaining answers for report ${this.params.reportId}`);

        const template = yield ReportsModel.findOne({ _id: this.params.reportId });

        const answers = yield AnswersService.getAllAnswers({
            template,
            reportId: this.params.reportId,
            loggedUser: this.state.loggedUser,
            team: this.state.team,
            query: this.state.query
        });


        if (!answers) {
            this.throw(404, 'Answers not found with these permissions');
            return;
        }
        this.body = AnswersSerializer.serialize(answers);
    }

    static * get() {
        logger.info(`Obtaining answer ${this.params.id} for report ${this.params.reportId}`);
        let filter = {};

        const template = yield ReportsModel.findOne({ _id: this.params.reportId });

        if (this.state.loggedUser.role === 'ADMIN' || this.state.loggedUser.id === template.user) {
            filter = {
                _id: new ObjectId(this.params.id),
                report: new ObjectId(this.params.reportId)
            };
        } else {
            filter = {
                user: new ObjectId(this.state.loggedUser.id),
                _id: new ObjectId(this.params.id),
                report: new ObjectId(this.params.reportId)
            };
        }
        const answer = yield AnswersModel.find(filter);
        if (!answer) {
            this.throw(404, 'Answer not found with these permissions');
            return;
        }
        this.body = AnswersSerializer.serialize(answer);
    }

    static * save() {
        logger.info('Saving answer');
        logger.debug(this.request.body);

        const fields = this.request.body.fields;
        let userPosition = [];

        try {
            userPosition = fields.userPosition ? fields.userPosition.split(',') : [];
        } catch(e) {
            this.throw(400, `Position values must be separated by ','`);
        }

        let answer = {
            report: this.params.reportId,
            reportName: fields.reportName,
            username: fields.username,
            organization: fields.organization,
            areaOfInterest: fields.areaOfInterest,
            language: fields.language,
            userPosition: userPosition,
            clickedPosition: JSON.parse(fields.clickedPosition),
            startDate: fields.startDate,
            endDate: fields.endDate,
            layer: fields.layer,
            user: new ObjectId(this.state.loggedUser.id),
            createdAt: fields.date,
            responses: []
        };

        const pushResponse = (question, response) => {
            answer.responses.push({
                name: question.name,
                value: typeof response !== 'undefined' ? response : null
            });
        };

        const pushError = (question) => {
            this.throw(400, `${question.label[answer.language]} (${question.name}) required`);
        };

        const questions = this.state.report.questions;

        if (!questions || (questions && !questions.length)) {
            this.throw(400, `No question associated with this report`);
        }

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];

            // handle parent questions
            const bodyAnswer = this.request.body.fields[question.name];
            const fileAnswer = this.request.body.files[question.name];
            let response = typeof bodyAnswer !== 'undefined' ?  bodyAnswer : fileAnswer;
            if (!response && question.required) {
                pushError(question);
            }
            if (response && response.path && response.name && question.type === 'blob') {
                //upload file
                response = yield s3Service.uploadFile(response.path, response.name);
            }

            pushResponse(question, response);

            // handle child questions
            if (question.childQuestions) {
                for (let j = 0; j < question.childQuestions.length; j++) {
                    const childQuestion = question.childQuestions[j];
                    const childBodyAnswer = this.request.body.fields[childQuestion.name];
                    const childFileAnswer = this.request.body.files[childQuestion.name];
                    const conditionMatches = typeof bodyAnswer !== 'undefined' && childQuestion.conditionalValue === bodyAnswer;
                    let childResponse = typeof childBodyAnswer !== 'undefined' ? childBodyAnswer : childFileAnswer;
                    if (!childResponse && childQuestion.required && conditionMatches) {
                        pushError(childQuestion);
                    }
                    if (childResponse && question.type === 'blob') {
                        //upload file
                        childResponse = yield s3Service.uploadFile(response.path, response.name);
                    }
                    pushResponse(childQuestion, childResponse);
                }
            }
        }

        const answerModel = yield new AnswersModel(answer).save();

        this.body = AnswersSerializer.serialize(answerModel);
    }

    static * update() {
        this.throw(500, 'Not implemented');
    }

    static * delete() {
        logger.info(`Deleting answer with id ${this.params.id}`);
        const result = yield AnswersModel.remove({
            $and: [
                { _id: new ObjectId(this.params.id) },
                { user: new ObjectId(this.state.loggedUser.id) }
            ]
        });
        if (!result || !result.result || result.result.ok === 0) {
            this.throw(404, 'Answer not found');
            return;
        }
        this.body = '';
        this.statusCode = 204;
    }
}

function * loggedUserToState(next) {
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

function * reportPermissions(next) {
    const team = yield TeamService.getTeam(this.state.loggedUser.id);
    let filters = {};
    if (team.data && team.data.attributes) {
        this.state.team = team.data.attributes;
        const manager = team.data.attributes.managers[0].id ? team.data.attributes.managers[0].id : team.data.attributes.managers[0];
        filters = {
            $and: [
                { _id: new ObjectId(this.params.reportId) },
                { $or: [{public: true}, {user: new ObjectId(this.state.loggedUser.id)}, {user: manager}] }
            ]
        };
    } else {
        filters = {
            $and: [
                { _id: new ObjectId(this.params.reportId) },
                { $or: [{public: true}, {user: new ObjectId(this.state.loggedUser.id)}] }
            ]
        };
    }
    
    const report = yield ReportsModel.findOne(filters).populate('questions');
    if (!report) {
        this.throw(404, 'Report not found');
        return;
    }
    this.state.report = report;
    yield next;
}

function * mapTemplateParamToId(next) {
    if (this.params.reportId === process.env.LEGACY_TEMPLATE_ID || this.params.reportId === 'default') {
        this.params.reportId = process.env.DEFAULT_TEMPLATE_ID;
    }
    yield next;
}

router.post('/', mapTemplateParamToId, loggedUserToState, reportPermissions, AnswersRouter.save);
router.patch('/:id', mapTemplateParamToId, loggedUserToState, AnswersRouter.update);
router.get('/', mapTemplateParamToId, loggedUserToState, reportPermissions, queryToState, AnswersRouter.getAll);
router.get('/:id', mapTemplateParamToId, loggedUserToState, queryToState, AnswersRouter.get);
router.delete('/:id', mapTemplateParamToId, loggedUserToState, AnswersRouter.delete);

module.exports = router;
