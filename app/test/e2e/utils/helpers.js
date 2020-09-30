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

module.exports = {
    createReport,
    getUUID
};
