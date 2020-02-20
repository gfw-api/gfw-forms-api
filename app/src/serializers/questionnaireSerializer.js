const logger = require('logger');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;

const questionnaireSerializer = new JSONAPISerializer('questionnaire', {
    attributes: [
        'name', 'questions', 'createdAt'
    ],
    resource: {
        attributes: ['type', 'content']
    },
    questions: {
        attributes: ['type', 'label', 'defaultValue', 'values', 'required']
    },
    typeForAttribute(attribute) { return attribute; },
    keyForAttribute: 'camelCase'
});

class QuestionnaireSerializer {

    static serialize(data) {
        return questionnaireSerializer.serialize(data);
    }

}

module.exports = QuestionnaireSerializer;
