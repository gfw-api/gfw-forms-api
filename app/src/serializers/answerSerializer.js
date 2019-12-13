var logger = require('logger');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

var answerSerializer = new JSONAPISerializer('answer', {
  attributes: [
    'questionnaire', 'responses', 'user'
  ],
  responses: {
      attributes: ['question', 'value']
  },
  typeForAttribute: function (attribute) { return attribute; },
  keyForAttribute: 'camelCase'
});

class AnswerSerializer {
  static serialize(data) {
    return answerSerializer.serialize(data);
  }
}

module.exports = AnswerSerializer;
