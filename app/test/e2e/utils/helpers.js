const Report = require('models/reportsModel');
const { ROLES } = require('./test.constants');

const getUUID = () => Math.random().toString(36).substring(7);

const createReport = (additionalData = {}) => {
    const uuid = getUUID();

    return new Report({
        name: `Report ${uuid}`,
        user: ROLES.USER.id,
        languages: ['en'],
        defaultLanguage: 'en',
        ...additionalData
    }).save();
};

const validRedisMessageArray = (expectedDataArray = []) => async (channel, message) => {
    const validateMessage = (expectedData) => {
        const { data, template, recipients } = expectedData;

        const messageData = JSON.parse(message);

        messageData.should.be.an('object');
        messageData.should.have.property('data').and.be.an('object');
        messageData.should.have.property('template').and.equal(template);
        messageData.should.have.property('recipients').and.deep.have.members(recipients);

        messageData.data.topic.should.equal(data.topic);
        messageData.data.tool.should.equal(data.tool);
        messageData.data.subject.should.equal(data.subject);
    };

    if (expectedDataArray.length === 0) {
        throw Error('Attempting to validate unexpected message');
    }
    const expectedData = expectedDataArray.shift();
    validateMessage(expectedData);

    // this.channel.removeAllListeners('message');
    // this.channel.on('message', validRedisMessageArray(expectedDataArray));
};

module.exports = {
    validRedisMessageArray,
    createReport,
    getUUID
};
