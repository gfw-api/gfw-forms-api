'use strict';

var logger = require('logger');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

var reportSerializer = new JSONAPISerializer('report', {
  attributes: [
    'template', 'areaOfInterest', 'language', 'userPosition', 'clickedPosition', 'timeFrame', 'layer', 'user', 'responses'
  ],
  responses: {
      attributes: ['question', 'answer']
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
