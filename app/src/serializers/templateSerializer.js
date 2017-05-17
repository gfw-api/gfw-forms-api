'use strict';

var logger = require('logger');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

var templateSerializer = new JSONAPISerializer('template', {
  attributes: [
    'name', 'questions', 'createdAt'
  ],
  resource: {
    attributes: ['type', 'content']
  },
  questions: {
      attributes: ['type', 'label', 'defaultValue', 'values', 'required']
  },
  typeForAttribute: function (attribute) { return attribute; },
  keyForAttribute: 'camelCase'
});

class TemplateSerializer {
  static serialize(data) {
    return templateSerializer.serialize(data);
  }
}

module.exports = TemplateSerializer;
