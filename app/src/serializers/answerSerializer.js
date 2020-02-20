const logger = require('logger');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;

const answerSerializer = new JSONAPISerializer('answer', {
    attributes: [
        'questionnaire', 'responses', 'user'
    ],
    responses: {
        attributes: ['question', 'value']
    },
    typeForAttribute(attribute) { return attribute; },
    keyForAttribute: 'camelCase'
});

class AnswerSerializer {

    static serialize(data) {
        return answerSerializer.serialize(data);
    }

}

module.exports = AnswerSerializer;
