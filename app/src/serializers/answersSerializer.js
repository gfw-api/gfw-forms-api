'use strict';

var logger = require('logger');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

var answersSerializer = new JSONAPISerializer('answers', {
  attributes: [
    'report', 'areaOfInterest', 'language', 'userPosition', 'clickedPosition', 'timeFrame', 'layer', 'user', 'responses'
  ],
  responses: {
      attributes: ['question', 'answer']
  },
  typeForAttribute: function (attribute) { return attribute; },
  keyForAttribute: 'camelCase'
});

class AnswersSerializer {
  static serialize(data) {
    return answersSerializer.serialize(data);
  }
}

module.exports = AnswersSerializer;
