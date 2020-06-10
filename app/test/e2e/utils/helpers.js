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
        areaOfInterest: ['5dc3d494bff9ff00164af8f0', '5dc407c9fb3b4b003fb0bb7c'],
        ...additionalData
    }).save();
};


module.exports = {
    createReport,
    getUUID
};
