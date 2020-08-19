const nock = require('nock');
const chai = require('chai');
const sinon = require('sinon');

const GoogleSheetsService = require('services/googleSheetsService');
const { getTestServer } = require('./utils/test-server');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

chai.should();

let requester;
let sinonSandbox;

describe('Request webinar endpoint tests', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();
    });

    beforeEach(() => { sinonSandbox = sinon.createSandbox(); });

    it('Name is required when trying to create a new webinar request', async () => {
        const response = await requester.post(`/api/v1/form/request-webinar`).send();
        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array').and.have.length(1);
        response.body.errors[0].should.have.property('code').and.equal('NAME_REQUIRED');
        response.body.errors[0].should.have.property('detail').and.equal('Name is required');
    });

    it('Email is required when trying to create a new webinar request', async () => {
        const response = await requester.post(`/api/v1/form/request-webinar`).send({ name: 'Test' });
        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array').and.have.length(1);
        response.body.errors[0].should.have.property('code').and.equal('EMAIL_REQUIRED');
        response.body.errors[0].should.have.property('detail').and.equal('Email is required');
    });

    it('A correctly formatted email is required when trying to create a new webinar request', async () => {
        const response = await requester.post(`/api/v1/form/request-webinar`).send({
            name: 'Test',
            email: 'test',
        });
        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array').and.have.length(1);
        response.body.errors[0].should.have.property('code').and.equal('EMAIL_INVALID');
        response.body.errors[0].should.have.property('detail').and.equal('Email is invalid');
    });

    it('A new line is added to the Google Spreadsheet when valid data us provided (happy case)', async () => {
        sinonSandbox.stub(GoogleSheetsService, 'requestWebinar')
            .callsFake(() => new Promise((resolve) => resolve()));

        const response = await requester.post(`/api/v1/form/request-webinar`).send({
            name: 'Test',
            email: 'example@gmail.com',
            request: 'Webinar request test',
        });
        response.status.should.equal(201);
    });

    it('If an error is thrown while adding the webinar request to the sheet, 500 is returned (error case)', async () => {
        sinonSandbox.stub(GoogleSheetsService, 'requestWebinar')
            .callsFake(() => new Promise((resolve, reject) => reject()));

        const response = await requester.post(`/api/v1/form/request-webinar`).send({
            name: 'Test',
            email: 'example@gmail.com',
            request: 'Webinar request test',
        });
        response.status.should.equal(500);
    });

    afterEach(async () => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        sinonSandbox.restore();
    });
});
