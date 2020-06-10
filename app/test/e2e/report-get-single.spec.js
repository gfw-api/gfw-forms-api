const nock = require('nock');
const config = require('config');
const Report = require('models/reportsModel');
const chai = require('chai');
const { ROLES } = require('./utils/test.constants');
const { getTestServer } = require('./utils/test-server');
const { createReport } = require('./utils/helpers');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

chai.should();

let requester;

describe('Get report by id endpoint', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();

        await Report.deleteMany({}).exec();
    });

    it('Getting report by id should return the report (happy case)', async () => {
        const createdReport = await createReport();

        const response = await requester
            .get(`/api/v1/reports/${createdReport._id}`)
            .query({ loggedUser: JSON.stringify(ROLES.USER) })
            .send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.instanceOf(Object);
        const responseReport = response.body.data;

        responseReport.id.should.equal(createdReport.id);
        responseReport.attributes.name.should.equal(createdReport.name);
        responseReport.attributes.should.have.property('languages').and.be.an('array').and.length(1).and.contains(createdReport.languages[0]);
        responseReport.attributes.should.have.property('defaultLanguage').and.equal(createdReport.defaultLanguage);
        responseReport.attributes.should.have.property('user').and.equal(createdReport.user.toString());
        responseReport.attributes.should.have.property('questions').and.be.an('array').and.length(0);
        responseReport.attributes.should.have.property('createdAt').and.be.a('string');
        responseReport.attributes.should.have.property('public').and.equal(false);
        responseReport.attributes.should.have.property('status').and.equal('unpublished');
        responseReport.attributes.should.have.property('areaOfInterest').and.be.an('array').and.length(2);
    });

    it('Getting the default report should return it (happy case)', async () => {
        const createdReport = await createReport({ _id: config.get('defaultTemplateId') });

        const response = await requester
            .get(`/api/v1/reports/default`)
            .query({ loggedUser: JSON.stringify(ROLES.USER) })
            .send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.instanceOf(Object);
        const responseReport = response.body.data;

        responseReport.id.should.equal(createdReport.id);
        responseReport.attributes.name.should.equal(createdReport.name);
        responseReport.attributes.should.have.property('languages').and.be.an('array').and.length(1).and.contains(createdReport.languages[0]);
        responseReport.attributes.should.have.property('defaultLanguage').and.equal(createdReport.defaultLanguage);
        responseReport.attributes.should.have.property('user').and.equal(createdReport.user.toString());
        responseReport.attributes.should.have.property('questions').and.be.an('array').and.length(0);
        responseReport.attributes.should.have.property('createdAt').and.be.a('string');
        responseReport.attributes.should.have.property('public').and.equal(false);
        responseReport.attributes.should.have.property('status').and.equal('unpublished');
        responseReport.attributes.should.have.property('areaOfInterest').and.be.an('array').and.length(2);
    });

    it('Getting the legacy report should return it (happy case)', async () => {
        const createdReport = await createReport({ _id: config.get('defaultTemplateId') });

        const response = await requester
            .get(`/api/v1/reports/${config.get('legacyTemplateId')}`)
            .query({ loggedUser: JSON.stringify(ROLES.USER) })
            .send();

        response.status.should.equal(200);
        response.body.should.have.property('data').and.instanceOf(Object);
        const responseReport = response.body.data;

        responseReport.id.should.equal(createdReport.id);
        responseReport.attributes.name.should.equal(createdReport.name);
        responseReport.attributes.should.have.property('languages').and.be.an('array').and.length(1).and.contains(createdReport.languages[0]);
        responseReport.attributes.should.have.property('defaultLanguage').and.equal(createdReport.defaultLanguage);
        responseReport.attributes.should.have.property('user').and.equal(createdReport.user.toString());
        responseReport.attributes.should.have.property('questions').and.be.an('array').and.length(0);
        responseReport.attributes.should.have.property('createdAt').and.be.a('string');
        responseReport.attributes.should.have.property('public').and.equal(false);
        responseReport.attributes.should.have.property('status').and.equal('unpublished');
        responseReport.attributes.should.have.property('areaOfInterest').and.be.an('array').and.length(2);

    });

    afterEach(async () => {
        await Report.deleteMany({}).exec();

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
