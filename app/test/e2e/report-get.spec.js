const nock = require('nock');
const chai = require('chai');
const Report = require('models/reportsModel');
const mongoose = require('mongoose');
const { createReport, mockGetUserFromToken } = require('./utils/helpers');
const { ROLES } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

chai.should();

let requester;

describe('Get reports tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();

        await Report.deleteMany({}).exec();
    });

    it('Get all reports as an anonymous user should return an "Not logged" error with matching 401 HTTP code', async () => {
        const response = await requester.get(`/api/v1/reports`).send();

        response.status.should.equal(401);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('status').and.equal(401);
        response.body.errors[0].should.have.property('detail').and.equal('Not logged');
    });

    it('Get all reports as an authenticated user should return an empty list', async () => {
        mockGetUserFromToken(ROLES.USER);
        const response = await requester
            .get(`/api/v1/reports`)
            .set('Authorization', `Bearer abcd`)
            .send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(0);
    });

    it('Get all reports should be successful and return a list of reports (populated db)', async () => {
        mockGetUserFromToken(ROLES.USER);
        const reportOne = await createReport({ user: ROLES.USER.id });
        const reportTwo = await createReport({ user: ROLES.USER.id });

        const response = await requester
            .get(`/api/v1/reports`)
            .set('Authorization', `Bearer abcd`)
            .send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(2);

        const responseReportOne = response.body.data[0];
        const responseReportTwo = response.body.data[1];

        responseReportOne.id.should.equal(reportOne.id);
        responseReportOne.attributes.name.should.equal(reportOne.name);
        responseReportOne.attributes.should.have.property('languages').and.be.an('array').and.length(1).and.contains(reportOne.languages[0]);
        responseReportOne.attributes.should.have.property('defaultLanguage').and.equal(reportOne.defaultLanguage);
        responseReportOne.attributes.should.have.property('user').and.equal(reportOne.user.toString());
        responseReportOne.attributes.should.have.property('questions').and.be.an('array').and.length(0);
        responseReportOne.attributes.should.have.property('createdAt').and.be.a('string');
        responseReportOne.attributes.should.have.property('public').and.equal(false);
        responseReportOne.attributes.should.have.property('status').and.equal('unpublished');

        responseReportTwo.id.should.equal(reportTwo.id);
        responseReportTwo.attributes.name.should.equal(reportTwo.name);
        responseReportTwo.attributes.should.have.property('languages').and.be.an('array').and.length(1).and.contains(reportTwo.languages[0]);
        responseReportTwo.attributes.should.have.property('defaultLanguage').and.equal(reportTwo.defaultLanguage);
        responseReportTwo.attributes.should.have.property('user').and.equal(reportTwo.user.toString());
        responseReportTwo.attributes.should.have.property('questions').and.be.an('array').and.length(0);
        responseReportTwo.attributes.should.have.property('createdAt').and.be.a('string');
        responseReportTwo.attributes.should.have.property('public').and.equal(false);
        responseReportTwo.attributes.should.have.property('status').and.equal('unpublished');
    });

    it('Get all reports without filter should be successful and return a list of reports which belong to the user or are public and published (populated db)', async () => {
        mockGetUserFromToken(ROLES.USER);

        const reportOne = await createReport({ user: ROLES.USER.id });
        const reportTwo = await createReport({ user: mongoose.Types.ObjectId(), public: true, status: 'published' });
        await createReport({ user: mongoose.Types.ObjectId(), public: false, status: 'published' });
        await createReport({ user: mongoose.Types.ObjectId(), public: true, status: 'unpublished' });

        const response = await requester
            .get(`/api/v1/reports`)
            .set('Authorization', `Bearer abcd`)
            .send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(2);

        const responseReportOne = response.body.data[0];
        const responseReportTwo = response.body.data[1];

        responseReportOne.id.should.equal(reportOne.id);
        responseReportOne.attributes.name.should.equal(reportOne.name);
        responseReportOne.attributes.should.have.property('languages').and.be.an('array').and.length(1).and.contains(reportOne.languages[0]);
        responseReportOne.attributes.should.have.property('defaultLanguage').and.equal(reportOne.defaultLanguage);
        responseReportOne.attributes.should.have.property('user').and.equal(reportOne.user.toString());
        responseReportOne.attributes.should.have.property('questions').and.be.an('array').and.length(0);
        responseReportOne.attributes.should.have.property('createdAt').and.be.a('string');
        responseReportOne.attributes.should.have.property('public').and.equal(false);
        responseReportOne.attributes.should.have.property('status').and.equal('unpublished');

        responseReportTwo.id.should.equal(reportTwo.id);
        responseReportTwo.attributes.name.should.equal(reportTwo.name);
        responseReportTwo.attributes.should.have.property('languages').and.be.an('array').and.length(1).and.contains(reportTwo.languages[0]);
        responseReportTwo.attributes.should.have.property('defaultLanguage').and.equal(reportTwo.defaultLanguage);
        responseReportTwo.attributes.should.have.property('user').and.not.equal(ROLES.USER.id);
        responseReportTwo.attributes.should.have.property('questions').and.be.an('array').and.length(0);
        responseReportTwo.attributes.should.have.property('createdAt').and.be.a('string');
        responseReportTwo.attributes.should.have.property('public').and.equal(true);
        responseReportTwo.attributes.should.have.property('status').and.equal('published');
    });

    afterEach(async () => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await Report.deleteMany({}).exec();
    });
});
