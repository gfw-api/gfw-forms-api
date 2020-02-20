const logger = require('logger');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;

const reportsSerializer = null;

function createSerializer(languages) {
    return new JSONAPISerializer('reports', {
        attributes: [
            'name', 'languages', 'defaultLanguage', 'user', 'answersCount', 'questions', 'createdAt', 'public', 'status', 'areaIds'
        ],
        questions: {
            attributes: ['type', 'label', 'defaultValue', 'values', 'required']
        },
        name: {
            attributes: languages
        },
        typeForAttribute(attribute) { return attribute; },
        keyForAttribute: 'camelCase'
    });
}

class ReportsSerializer {

    static serialize(data) {
        logger.debug(data);
        if (Array.isArray(data)) {
            const reports = { data: [] };
            data.forEach((report) => {
                const serializedData = createSerializer(report.languages).serialize(report);
                reports.data.push(serializedData.data);
            });
            return reports;
        }
        return createSerializer(data.languages).serialize(data);

    }

}

module.exports = ReportsSerializer;
