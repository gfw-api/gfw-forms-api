const Router = require('koa-router');
const logger = require('logger');
const ReportsSerializer = require('serializers/reportsSerializer');
const ReportsModel = require('models/reportsModel');
const ReportsValidator = require('validators/reportsValidator');
const AnswersModel = require('models/answersModel');
const AnswersService = require('services/answersService');
const TeamService = require('services/teamService');
const passThrough = require('stream').PassThrough;
const { ObjectId } = require('mongoose').Types;
const config = require('config');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const CSV = require('services/csvService');


const router = new Router({
    prefix: '/reports'
});

class ReportsRouter {

    static* getAll() {
        logger.info('Obtaining all reports');
        const filter = {
            $and: [
                {
                    $or: [
                        { $and: [{ public: true }, { status: 'published' }] },
                        { user: new ObjectId(this.state.loggedUser.id) }]
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

    static* get() {
        logger.info(`Obtaining reports with id ${this.params.id}`);
        const report = yield ReportsModel.findOne({ _id: this.params.id });
        if (!report) {
            this.throw(404, 'Report not found');
            return;
        }
        // attach all areas of interest to the template response
        let AOI = this.params.id;
        let results = [];
        try {
            logger.info(`Find all AOI's ...`);

            const result = yield ctRegisterMicroservice.requestToMicroservice({
                uri: '/v1/area/find/' + AOI,
                method: 'GET',
                json: true,
                body: {
                    userId: this.state.loggedUser.id
                }
            });
             results = result.data.map(a => a.id);
        } catch (e) {
            logger.error(e);
            this.throw(500, 'No areas of interest for this template ');
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
        Object.assign(report, {areaIds: results });

        this.body = ReportsSerializer.serialize(report);
    }

    static* save() {
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
            let AOI = request.areaOfInterest;
            logger.info(AOI);
            for (let i = 0; i < AOI.length; i++) {
                try {
                    logger.info(`PATCHing new area of interest ${request.oldAreaOfInterest}...`);

                    const result = yield ctRegisterMicroservice.requestToMicroservice({
                        uri: '/v1/area/' + AOI[i],
                        method: 'PATCH',
                        json: true,
                        body: {
                            templateId: {reportId},
                            userId: this.state.loggedUser.id
                        }
                    });
                } catch (e) {
                    const result = yield ReportsModel.remove({_id: reportId});
                    logger.error('request to microservice failed');
                    logger.error(e);
                    this.throw(500, 'Error creating templates: patch to area failed');
                    return;
                }
            }

        }

        this.body = ReportsSerializer.serialize(report);
    }

    static* put() {
        logger.info('Updating report', this.request.body);
        const { body } = this.request;

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
        const answers = yield AnswersModel.count({ report: new ObjectId(this.params.id) });
        report.answersCount = answers;
        report.updatedDate = Date.now;

        yield report.save();
        this.body = ReportsSerializer.serialize(report);
    }

    static* patch() {
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
        // add questions to the model to update if they are included
        if (request.questions) {
            report.questions = request.questions;
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
        // compare old area to new area to find if items exists
        let areasToRemove = [];
        if(request.oldAreaOfInterest) {
            areasToRemove = request.oldAreaOfInterest.filter(elementToCompare =>
                !request.areaOfInterest.includes(elementToCompare)
            );
        }
        logger.info('removing area' + areasToRemove)
        // PATCH templateId onto area
        // Remove report if PATCH fails
        if (areasToRemove) {
            // remove old area
            logger.info(`PATCHing second new area of interest ${request.oldAreaOfInterest}...`);
            for (let i = 0; i < areasToRemove.length; i++) {
                try {

                    const result = yield ctRegisterMicroservice.requestToMicroservice({
                        uri: '/v1/area/' + areasToRemove[i],
                        method: 'PATCH',
                        json: true,
                        body: {
                            templateId: [this.params.id],
                            override: true,
                            userId: this.state.loggedUser.id
                        }
                    });

                } catch (e) {
                    logger.error(e);
                    this.throw(500, 'PATCHing new area has failed');
                    return;
                }
            }
        }
            // PATCH new area
            if (request.areaOfInterest) {
                logger.info(`PATCHing second new area of interest ${request.oldAreaOfInterest}...`);
                let AOI = request.areaOfInterest;
                for (let i = 0; i < AOI.length; i++) {
                    try {
                        const result = yield ctRegisterMicroservice.requestToMicroservice({
                            uri: '/v1/area/' + AOI[i],
                            method: 'PATCH',
                            json: true,
                            body: {
                                templateId: [this.params.id],
                                userId: this.state.loggedUser.id
                            }
                        });
                    } catch (e) {
                        logger.error(e);
                        this.throw(500, 'PATCHing new area has failed');
                        return;
                    }
                }
            }
        // add answers count to return and updated date
        const answers = yield AnswersModel.count({ report: new ObjectId(this.params.id) });
        report.answersCount = answers;
        report.updatedDate = Date.now;

        yield report.save();
        this.body = ReportsSerializer.serialize(report);
    }

    static* delete() {
        const { role } = this.state.loggedUser;
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

    static* downloadAnswers() {
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
        if (!report) {
            this.throw(404, 'Report not found');
            return;
        }

        report = report.toObject();

        const questionLabels = report.questions.reduce((acc, question) => ({
            ...acc,
            [question.name]: question.label[report.defaultLanguage],
            ...question.childQuestions.reduce((acc2, childQuestion) => ({
                ...acc2,
                [childQuestion.name]: childQuestion.label[report.defaultLanguage]
            }), {})
        }), {
            userId: 'User',
            reportName: 'Name',
            areaOfInterest: 'Area of Interest',
            areaOfInterestName: 'Area of Interest name',
            clickedPositionLat: 'Position of report lat',
            clickedPositionLon: 'Position of report lon',
            userPositionLat: 'Position of user lat',
            userPositionLon: 'Position of user lon',
            layer: 'Alert type'
        });

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

        const data = answers.map((answer) => answer.toObject())
            .map((answer) => {
                const responses = {
                    userId: answer.user || null,
                    reportName: answer.reportName,
                    areaOfInterest: answer.areaOfInterest || null,
                    areaOfInterestName: answer.areaOfInterestName || null,
                    clickedPositionLat: answer.clickedPosition.length ? answer.clickedPosition[0].lat : null,
                    clickedPositionLon: answer.clickedPosition.length ? answer.clickedPosition[0].lon : null,
                    userPositionLat: answer.userPosition.length ? answer.userPosition[0] : null,
                    userPositionLon: answer.userPosition.length ? answer.userPosition[1] : null,
                };

                answer.responses.forEach((response) => {
                    const currentQuestion = { ...report.questions.find((question) => (question.name && question.name === response.name)) };

                    responses[response.name] = response.value;
                    if (response.value !== null && ['checkbox', 'radio', 'select'].includes(currentQuestion.type)) {
                        const getCurrentValue = (list, val) => (list.find((item) => (item.value === val || item.value === parseInt(val, 10))));
                        // eslint-disable-next-line no-restricted-globals
                        const values = !response.value.includes(',') && !isNaN(parseInt(response.value, 10)) ? [response.value] : response.value.split(',');
                        const questionValues = currentQuestion.values[report.defaultLanguage];
                        responses[response.name] = values.reduce((acc, value) => {
                            const val = getCurrentValue(questionValues, value);
                            const accString = acc !== '' ? `${acc}, ` : acc;
                            return typeof val !== 'undefined' ? `${accString}${val.label}` : `${accString}${value}`;
                        }, '');
                    }
                });
                return Object.entries(responses).reduce((acc, [key, value]) => {
                    const label = questionLabels[key] || key;
                    return {
                        ...acc,
                        [label]: value
                    };
                }, {});
            });
        this.body.write(CSV.convert(data));
        this.body.end();
    }

}

function* mapTemplateParamToId(next) {
    if (this.params.id === config.get('legacyTemplateId') || this.params.id === 'default') {
        this.params.id = config.get('defaultTemplateId');
    }
    yield next;
}

function* loggedUserToState(next) {
    if (this.query && this.query.loggedUser) {
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

function* queryToState(next) {
    if (this.request.query && Object.keys(this.request.query).length > 0) {
        this.state.query = this.request.query;
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
