'use strict';

var logger = require('logger');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

var reportSerializer = new JSONAPISerializer('report', {
  attributes: [
    'template', 'responses', 'user'
  ],
  responses: {
      attributes: ['question', 'value']
  },
  typeForAttribute: function (attribute) { return attribute; },
  keyForAttribute: 'camelCase'
});

class ReportSerializer {
  static serialize(data) {
    return reportSerializer.serialize(data);
  }
}

module.exports = ReportSerializer;
