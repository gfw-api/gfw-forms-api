const nock = require('nock');
const chai = require('chai');
const redis = require('redis');
const config = require('config');
const moment = require('moment');
const { getTestServer } = require('./utils/test-server');
const { SPREADSHEET_CELLS_REPLY, SPREADSHEET_LIST_REPLY } = require('./utils/test.constants');
const { validRedisMessageArray } = require('./utils/helpers');

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

const should = chai.should();

const CHANNEL = config.get('apiGateway.queueName');

let requester;

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

describe('Contact us tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        this.channel = redis.createClient({ url: config.get('apiGateway.queueUrl') });
        this.channel.subscribe(CHANNEL);

        requester = await getTestServer();
    });

    it('Post a contact-us request without a tool param should return a 400 error', async () => {
        this.channel.on('message', () => should.fail('should not be called'));

        const response = await requester
            .post(`/api/v1/form/contact-us`)
            .send();

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('detail').and.equal('tool can not be empty.');
    });

    it('Post a contact-us request with an unsupported tool param should return a 400 error', async () => {
        this.channel.on('message', () => should.fail('should not be called'));

        const response = await requester
            .post(`/api/v1/form/contact-us`)
            .send({
                tool: 'fake'
            });

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('detail').and.equal('tool must be in [gfw,gfw-pro,fw,blog,map-builder,not-applicable].');
    });

    it('Post a contact-us request with an unsupported topic param should return a 400 error', async () => {
        this.channel.on('message', () => should.fail('should not be called'));

        const response = await requester
            .post(`/api/v1/form/contact-us`)
            .send({
                tool: 'gfw',
                topic: 'fake'
            });

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array').and.length(1);
        response.body.errors[0].should.have.property('detail').and.equal('topic must be in [report-a-bug-or-error,provide-feedback,data-related-inquiry,general-inquiry].');
    });

    it('Post a contact-us request with a supported tool param should return a 200 (happy case)', async () => {
        process.on('unhandledRejection', (error) => {
            should.fail(error.message);
        });

        nock('https://accounts.google.com')
            .post('/o/oauth2/token',
                (body) => {
                    if (body.grant_type !== 'urn:ietf:params:oauth:grant-type:jwt-bearer') {
                        return false;
                    }
                    if (!('assertion' in body)) {
                        return false;
                    }
                    return true;
                })
            .reply(200, {
                access_token: 'access_token',
                expires_in: 3599,
                token_type: 'Bearer'
            });

        nock('https://spreadsheets.google.com')
            .get(`/feeds/cells/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full`)
            .query({ 'min-col': '5', 'max-col': '5' })
            .reply(200, SPREADSHEET_CELLS_REPLY, [
                'Content-Type',
                'application/atom+xml; charset=UTF-8; type=feed'
            ]);

        this.channel.on('message', validRedisMessageArray([{
            template: 'contact-form',
            data: {
                topic: 'General inquiry',
                tool: 'GFW',
                subject: 'Contact form: General inquiry for GFW'
            },
            recipients: [{ address: 'gfw2@wri.org' }],
        }, {
            template: 'contact-form-confirmation-en',
            data: {
                topic: 'General inquiry',
                tool: 'GFW',
                subject: 'Contact form: General inquiry for GFW'
            },
            recipients: [{}],
        }]));


        const response = await requester
            .post(`/api/v1/form/contact-us`)
            .send({
                tool: 'gfw'
            });

        response.status.should.equal(200);
    });

    it('Post a contact-us request with a supported tool and topic params should return a 200 (happy case)', async () => {
        process.on('unhandledRejection', (error) => {
            should.fail(error.message);
        });

        nock('https://accounts.google.com')
            .post('/o/oauth2/token',
                (body) => {
                    if (body.grant_type !== 'urn:ietf:params:oauth:grant-type:jwt-bearer') {
                        return false;
                    }
                    if (!('assertion' in body)) {
                        return false;
                    }
                    return true;
                })
            .reply(200, {
                access_token: 'access_token',
                expires_in: 3599,
                token_type: 'Bearer'
            });

        nock('https://spreadsheets.google.com')
            .get(`/feeds/cells/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full`)
            .query({ 'min-col': '5', 'max-col': '5' })
            .reply(200, SPREADSHEET_CELLS_REPLY, [
                'Content-Type',
                'application/atom+xml; charset=UTF-8; type=feed'
            ]);

        this.channel.on('message', validRedisMessageArray([{
            template: 'contact-form',
            data: {
                topic: 'Provide feedback',
                tool: 'GFW',
                subject: 'Contact form: Provide feedback for GFW'
            },
            recipients: [{ address: 'gfw2@wri.org' }],
        }, {
            template: 'contact-form-confirmation-en',
            data: {
                topic: 'Provide feedback',
                tool: 'GFW',
                subject: 'Contact form: Provide feedback for GFW'
            },
            recipients: [{}],
        }]));


        const response = await requester
            .post(`/api/v1/form/contact-us`)
            .send({
                tool: 'gfw',
                topic: 'provide-feedback'
            });

        response.status.should.equal(200);
    });

    it('Post a contact-us request with a supported tool, topic and user data should return a 200 (happy case)', async () => {
        process.on('unhandledRejection', (error) => {
            should.fail(error.message);
        });

        nock('https://accounts.google.com')
            .post('/o/oauth2/token',
                (body) => {
                    if (body.grant_type !== 'urn:ietf:params:oauth:grant-type:jwt-bearer') {
                        return false;
                    }
                    if (!('assertion' in body)) {
                        return false;
                    }
                    return true;
                })
            .reply(200, {
                access_token: 'access_token',
                expires_in: 3599,
                token_type: 'Bearer'
            });

        nock('https://spreadsheets.google.com')
            .get(`/feeds/cells/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full`)
            .query({ 'min-col': '5', 'max-col': '5' })
            .reply(200, SPREADSHEET_CELLS_REPLY, [
                'Content-Type',
                'application/atom+xml; charset=UTF-8; type=feed'
            ]);

        nock('https://spreadsheets.google.com')
            .get(`/feeds/list/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full`)
            .query({ 'start-index': '1', 'max-results': '1' })
            .reply(200, SPREADSHEET_LIST_REPLY, [
                'Content-Type',
                'application/atom+xml; charset=UTF-8; type=feed'
            ]);

        this.channel.on('message', validRedisMessageArray([{
            template: 'contact-form',
            data: {
                topic: 'Provide feedback',
                tool: 'GFW',
                subject: 'Contact form: Provide feedback for GFW'
            },
            recipients: [{ address: 'gfw2@wri.org' }],
        }, {
            template: 'contact-form-confirmation-en',
            data: {
                topic: 'Provide feedback',
                tool: 'GFW',
                subject: 'Contact form: Provide feedback for GFW'
            },
            recipients: [{ address: 'test@gmail.com' }],
        }]));


        const response = await requester
            .post(`/api/v1/form/contact-us`)
            .send({
                tool: 'gfw',
                topic: 'provide-feedback',
                email: 'test@gmail.com',
                signup: false
            });

        response.status.should.equal(200);
    });

    it('Post a contact-us request with a supported tool, topic, message and user data should return a 200 (happy case)', async () => {
        process.on('unhandledRejection', (error) => {
            should.fail(error.message);
        });

        nock('https://accounts.google.com')
            .post('/o/oauth2/token',
                (body) => {
                    if (body.grant_type !== 'urn:ietf:params:oauth:grant-type:jwt-bearer') {
                        return false;
                    }
                    if (!('assertion' in body)) {
                        return false;
                    }
                    return true;
                })
            .reply(200, {
                access_token: 'access_token',
                expires_in: 3599,
                token_type: 'Bearer'
            });

        nock('https://spreadsheets.google.com')
            .get(`/feeds/cells/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full`)
            .query({ 'min-col': '5', 'max-col': '5' })
            .reply(200, SPREADSHEET_CELLS_REPLY, [
                'Content-Type',
                'application/atom+xml; charset=UTF-8; type=feed'
            ]);

        nock('https://spreadsheets.google.com')
            .get(`/feeds/list/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full`)
            .query({ 'start-index': '1', 'max-results': '1' })
            .reply(200, SPREADSHEET_LIST_REPLY, [
                'Content-Type',
                'application/atom+xml; charset=UTF-8; type=feed'
            ]);

        this.channel.on('message', validRedisMessageArray([{
            template: 'contact-form',
            data: {
                topic: 'Provide feedback',
                tool: 'GFW',
                subject: 'Contact form: Provide feedback for GFW',
                message: 'This is a test message'
            },
            recipients: [{ address: 'gfw2@wri.org' }],
        }, {
            template: 'contact-form-confirmation-en',
            data: {
                topic: 'Provide feedback',
                tool: 'GFW',
                subject: 'Contact form: Provide feedback for GFW',
                message: 'This is a test message'
            },
            recipients: [{ address: 'test@gmail.com' }],
        }]));


        const response = await requester
            .post(`/api/v1/form/contact-us`)
            .send({
                tool: 'gfw',
                topic: 'provide-feedback',
                email: 'test@gmail.com',
                signup: false,
                message: 'This is a test message'
            });

        response.status.should.equal(200);
    });

    it('Post a contact-us request with a supported tool, topic, message and user data for a new user with sign up set to true should return a 200 and add a new user to the spreadsheet', async () => {
        process.on('unhandledRejection', (error) => {
            should.fail(error.message);
        });

        nock('https://accounts.google.com')
            .post('/o/oauth2/token',
                (body) => {
                    if (body.grant_type !== 'urn:ietf:params:oauth:grant-type:jwt-bearer') {
                        return false;
                    }
                    if (!('assertion' in body)) {
                        return false;
                    }
                    return true;
                })
            .reply(200, {
                access_token: 'access_token',
                expires_in: 3599,
                token_type: 'Bearer'
            });

        nock('https://spreadsheets.google.com')
            .get(`/feeds/cells/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full`)
            .query({ 'min-col': '5', 'max-col': '5' })
            .reply(200, SPREADSHEET_CELLS_REPLY, [
                'Content-Type',
                'application/atom+xml; charset=UTF-8; type=feed'
            ]);

        nock('https://spreadsheets.google.com:443')
            .post(`/feeds/list/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full`, `<entry xmlns="http://www.w3.org/2005/Atom" xmlns:gsx="http://schemas.google.com/spreadsheets/2006/extended">\n<gsx:agreedtotest>yes</gsx:agreedtotest>\n<gsx:datefirstadded>${(moment().format('MM/DD/YYYY'))}</gsx:datefirstadded>\n<gsx:email>test2@gmail.com</gsx:email>\n<gsx:source>GFW Feedback Form</gsx:source>\n</entry>`)
            .reply(201, `<?xml version='1.0' encoding='UTF-8'?><entry xmlns='http://www.w3.org/2005/Atom' xmlns:gsx='http://schemas.google.com/spreadsheets/2006/extended' xmlns:gd='http://schemas.google.com/g/2005' gd:etag='&quot;AkdbEidvOCt7ImA9CE4PEE4.&quot;'><id>https://spreadsheets.google.com/feeds/list/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/1t08ik</id><updated>2020-03-27T11:28:46.695Z</updated><app:edited xmlns:app='http://www.w3.org/2007/app'>2020-03-27T11:28:46.695Z</app:edited><category scheme='http://schemas.google.com/spreadsheets/2006' term='http://schemas.google.com/spreadsheets/2006#list'/><title>3/27/20</title><content>email: test2@gmail.com, source: GFW Feedback Form, agreedtotest: yes</content><link rel='self' type='application/atom+xml' href='https://spreadsheets.google.com/feeds/list/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full/1t08ik'/><link rel='edit' type='application/atom+xml' href='https://spreadsheets.google.com/feeds/list/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full/1t08ik'/><gsx:datefirstadded>3/27/20</gsx:datefirstadded><gsx:first></gsx:first><gsx:last></gsx:last><gsx:title></gsx:title><gsx:email>test2@gmail.com</gsx:email><gsx:otheremail></gsx:otheremail><gsx:phone></gsx:phone><gsx:skype></gsx:skype><gsx:addresslocation></gsx:addresslocation><gsx:organizationsector></gsx:organizationsector><gsx:positionprimaryresponsibilities></gsx:positionprimaryresponsibilities><gsx:source>GFW Feedback Form</gsx:source><gsx:otherhowdoyouuseorplantousegfw></gsx:otherhowdoyouuseorplantousegfw><gsx:dateaskedtotest></gsx:dateaskedtotest><gsx:testdatetype></gsx:testdatetype><gsx:testdatetype_2></gsx:testdatetype_2><gsx:testdatetype_3></gsx:testdatetype_3><gsx:testdatetype_4></gsx:testdatetype_4><gsx:agreedtotest>yes</gsx:agreedtotest><gsx:userkey></gsx:userkey></entry>`, [
                'Content-Type',
                'application/atom+xml; charset=UTF-8; type=entry'
            ]);


        this.channel.on('message', validRedisMessageArray([{
            template: 'contact-form',
            data: {
                topic: 'Provide feedback',
                tool: 'GFW',
                subject: 'Contact form: Provide feedback for GFW',
                message: 'This is a test message'
            },
            recipients: [{ address: 'gfw2@wri.org' }],
        }, {
            template: 'contact-form-confirmation-en',
            data: {
                topic: 'Provide feedback',
                tool: 'GFW',
                subject: 'Contact form: Provide feedback for GFW',
                message: 'This is a test message'
            },
            recipients: [{ address: 'test2@gmail.com' }],
        }]));


        const response = await requester
            .post(`/api/v1/form/contact-us`)
            .send({
                tool: 'gfw',
                topic: 'provide-feedback',
                email: 'test2@gmail.com',
                signup: 'true',
                message: 'This is a test message'
            });

        response.status.should.equal(200);
    });

    afterEach(async () => {
        process.removeAllListeners('unhandledRejection');
        this.channel.removeAllListeners('message');

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
