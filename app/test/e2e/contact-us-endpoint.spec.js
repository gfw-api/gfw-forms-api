const nock = require('nock');
const chai = require('chai');
const sinon = require('sinon');

const { getTestServer } = require('./utils/test-server');
const { stubGoogleSpreadsheet } = require('./utils/stubs');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

chai.should();

let requester;
let sinonSandbox;

describe('Contact us endpoint tests', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();
    });

    beforeEach(() => { sinonSandbox = sinon.createSandbox(); });

    it('Calling the contact us endpoint returns 200 OK (happy case)', async () => {
        stubGoogleSpreadsheet(sinonSandbox);
        const response = await requester.post(`/api/v1/form/contact-us`).send({ tool: 'gfw' });
        response.status.should.equal(200);
        response.body.should.equal('');
    });

    afterEach(async () => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        sinonSandbox.restore();
    });
});
