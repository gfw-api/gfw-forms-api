const nock = require('nock');
const chai = require('chai');

const { getTestServer } = require('./utils/test-server');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

chai.should();

let requester;

describe('Contribution data endpoint tests', () => {
    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        requester = await getTestServer();
    });

    it('Calling the contribution data endpoint returns 200 OK (happy case)', async () => {
        const response = await requester.post(`/api/v1/form/contribution-data`).send();
        response.status.should.equal(200);
        response.body.should.equal('');
    });

    afterEach(async () => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
