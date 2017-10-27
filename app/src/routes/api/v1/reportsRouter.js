'use strict';
const Router = require('koa-router');
const logger = require('logger');
const ReportsSerializer = require('serializers/reportsSerializer');
const ReportsModel = require('models/reportsModel');
const ReportsValidator = require('validators/reportsValidator');
const AnswersModel = require('models/answersModel');
const AnswersService = require('services/answersService');
const TeamService = require('services/teamService');
const passThrough = require('stream').PassThrough;
const json2csv = require('json2csv');
const ObjectId = require('mongoose').Types.ObjectId;
const ctRegisterMicroservice = require('ct-register-microservice-node');


const router = new Router({
    prefix: '/reports'
});

class ReportsRouter {

    static * getAll() {
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
                    report: new ObjectId(reports[i].id)
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
            this.throw(404, 'Report not found');
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
            this.throw(403, 'Admin permissions required to save public templates');
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
                return;
            }
        }

        this.body = ReportsSerializer.serialize(report);
    }

    static * put() {
        logger.info('Updating report', this.request.body);
        const body = this.request.body;

        if (this.state.loggedUser.role !== 'ADMIN') {
            this.throw(403, 'Only admins can update reports.');
            return;
        }

        const report = yield ReportsModel.findOne({ _id: new ObjectId(this.params.id) });

        if (!report) {
            this.throw(404, 'Report not found with these permissions');
            return;
        }

        Object.assign(report, body);

        // add answers count to return and updated date
        const answers = yield AnswersModel.count({report: new ObjectId(this.params.id)});
        report.answersCount = answers;
        report.updatedDate = Date.now;

        yield report.save();
        this.body = ReportsSerializer.serialize(report);
    }

    static * patch(){
        logger.info(`Updating template with id ${this.params.id}...`);

        const reportFilter = {
            $and: [
                { _id: new ObjectId(this.params.id) }
            ]
        };
        if (this.state.loggedUser.role !== 'ADMIN') {
            reportFilter.$and.push({ user: new ObjectId(this.state.loggedUser.id) });
        }
        const report = yield ReportsModel.findOne(reportFilter);
        const request = this.request.body;

        // if user did not create then return error
        if (!report) {
            this.throw(404, 'Report not found.');
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
                logger.info(`PATCHing old area of interest ${request.oldAreaOfInterest}...`);
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
                    return;
                }
            }

            // PATCH new area
            if (request.areaOfInterest) {
                logger.info(`PATCHing new area of interest ${request.oldAreaOfInterest}...`);
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
                    return;
                }
            }
        }

        // add answers count to return and updated date
        const answers = yield AnswersModel.count({report: new ObjectId(this.params.id)});
        report.answersCount = answers;
        report.updatedDate = Date.now;

        yield report.save();
        this.body = ReportsSerializer.serialize(report);
    }

    static * delete() {
        const role = this.state.loggedUser.role;
        const aoi = this.state.query && this.state.query.aoi !== null ? this.state.query.aoi.split(',') : null;
        logger.info(`Checking report for answers...`);
        const answers = yield AnswersModel.count({ report: new ObjectId(this.params.id) });
        if (answers > 0 && role !== 'ADMIN') {
            this.throw(403, 'This report has answers, you cannot delete. Please unpublish instead.');
            return;
        }
        logger.info(`Report has no answers.`);
        logger.info(`Deleting report with id ${this.params.id}...`);
        if (aoi !== null) {
            for (let i = 0; i < aoi.length; i++) {
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
                    return;
                }
            }
            logger.info('Areas patched. Removing template...');
        }

        // finally remove template
        const query = {
            $and: [
                { _id: new ObjectId(this.params.id) }
            ]
        };
        if (role !== 'ADMIN') {
            query.$and.push({ user: new ObjectId(this.state.loggedUser.id) });
            query.$and.push({ status: ['draft', 'unpublished'] });
        } else if (answers > 0) {
            logger.info('User is admin, removing report answers...');
            yield AnswersModel.remove({ report: new ObjectId(this.params.id) });
        }
        const result = yield ReportsModel.remove(query);

        if (!result || !result.result || result.result.ok === 0) {
            this.throw(404, 'Report not found with these permissions. You must be the owner to remove.');
            return;
        }
        this.statusCode = 204;
    }

    static * downloadAnswers() {
        logger.info(`Downloading answers for report ${this.params.id}`);
        this.set('Content-disposition', `attachment; filename=${this.params.id}.csv`);
        this.set('Content-type', 'text/csv');
        this.body = passThrough();

        let report = yield ReportsModel.findOne({
            $and: [
                { _id: new ObjectId(this.params.id) },
                { $or: [{ public: true }, { user: new ObjectId(this.state.loggedUser.id) }] }
            ]
        });
        report = report.toObject();

        if (!report) {
            this.throw(404, 'Report not found');
            return;
        }

        const questions = {
            userId: null,
            reportName: null,
            areaOfInterest: null,
            clickedPositionLat: null,
            clickedPositionLon: null,
            userPositionLat: null,
            userPositionLon: null,
            alertSystem: null
        };

        const questionLabels = {
            userId: 'User',
            reportName: 'Name',
            areaOfInterest: 'Area of Interest',
            clickedPositionLat: 'Position of report lat',
            clickedPositionLon: 'Position of report lon',
            userPositionLat: 'Position of user lat',
            userPositionLon: 'Position of user lon',
            alertSystem: 'Alert type'
        };

        report.questions.forEach((question) => {
            questions[question.name] = '';
            question.childQuestions.forEach((childQuestion) => {
                questions[childQuestion.name] = '';
            });
        });

        report.questions.forEach((question) => {
            questionLabels[question.name] = question.label[report.defaultLanguage];
            question.childQuestions.forEach((childQuestion) => {
                questionLabels[childQuestion.name] = childQuestion.label[report.defaultLanguage];
            });
        });

        const questionLabelsData = json2csv({
            data: questionLabels,
            hasCSVColumnTitle: false
        }) + '\n';
        this.body.write(questionLabelsData);

        const team = yield TeamService.getTeam(this.state.loggedUser.id);
        let teamData = null;
        if (team.data && team.data.attributes) {
            teamData = team.data.attributes;
        }

        const answers = yield AnswersService.getAllAnswers({
            team: teamData,
            reportId: this.params.id,
            template: report,
            query: null,
            loggedUser: this.state.loggedUser
        });

        logger.info('Obtaining data');

        let data = null;
        answers.map(answer => answer.toObject())
            .forEach((answer) => {
              const responses = Object.assign({}, questions, {
                  userId: answer.user || null,
                  reportName: answer.reportName,
                  areaOfInterest: answer.areaOfInterest || null,
                  clickedPositionLat: answer.clickedPosition.length ? answer.clickedPosition[0].lat : null,
                  clickedPositionLon: answer.clickedPosition.length ? answer.clickedPosition[0].lon : null,
                  userPositionLat: answer.userPosition.length ? answer.userPosition[0] : null
              });

              answer.responses.forEach((response) => {
                let currentQuestion = Object.assign({}, report.questions.find((question) => (question.name && question.name === response.name)));

                if (response.value !== null) {
                    if (['checkbox', 'radio', 'select'].includes(currentQuestion.type)) {
                        const getCurrentValue = (list, val) => (list.find((item) => (item.value === val || item.value === parseInt(val))));
                        const values = !response.value.includes(',') && !isNaN(parseInt(response.value)) ? [response.value] : response.value.split(',');
                        const questionValues = currentQuestion.values[report.defaultLanguage];
                        responses[response.name] = values.map(value => {
                            const val = getCurrentValue(questionValues, value);
                            return typeof val !== 'undefined' ? val.label : value;
                        })
                            .reduce((acc, next) => {
                                return acc ? `${acc}\n${next}` : `${next}`;
                            }, '');
                    } else {
                        responses[response.name] = response.value;
                    }
                } else {
                    responses[response.name] = response.value;
                }
              });

              data = json2csv({
                data: responses,
                hasCSVColumnTitle: false
              }) + '\n';
              this.body.write(data);
            });

        this.body.end();
    }
}

function * mapTemplateParamToId(next) {
    if (this.params.id === process.env.LEGACY_TEMPLATE_ID || this.params.id === 'default') {
        this.params.id = process.env.DEFAULT_TEMPLATE_ID;
    }
    yield next;
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
router.patch('/:id', mapTemplateParamToId, loggedUserToState, ReportsValidator.patch, ReportsRouter.patch);
router.get('/', loggedUserToState, queryToState, ReportsRouter.getAll);
router.get('/:id', mapTemplateParamToId, loggedUserToState, queryToState, ReportsRouter.get);
router.put('/:id', mapTemplateParamToId, loggedUserToState, queryToState, ReportsValidator.create, ReportsRouter.put);
router.delete('/:id', mapTemplateParamToId, loggedUserToState, queryToState, ReportsRouter.delete);
router.get('/:id/download-answers', mapTemplateParamToId, loggedUserToState, ReportsRouter.downloadAnswers);

module.exports = router;
