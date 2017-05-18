'use strict';

var logger = require('logger');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

var templateSerializer = null;

function createSerializer(languages) {
    return new JSONAPISerializer('template', {
      attributes: [
        'name', 'label', 'questions', 'createdAt', 'defaultLanguage', 'languages', 'areaOfInterest', 'user'
      ]
      questions: {
          attributes: ['type', 'label', 'defaultValue', 'values', 'required']
      },
      label: {
          attributes: languages
      },
      typeForAttribute: function (attribute) { return attribute; },
      keyForAttribute: 'camelCase'
    });
}

class TemplateSerializer {
  static serialize(data) {
    let languages = null;
    if(data && data.length > 0) {
        languages = data[0].languages;
    } else {
        languages = data.languages;
    }
    return createSerializer(languages).serialize(data);
  }
}

module.exports = TemplateSerializer;
