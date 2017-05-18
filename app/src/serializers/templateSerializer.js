'use strict';

var logger = require('logger');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

var templateSerializer = null;

function createSerializer(languages) {
    return new JSONAPISerializer('template', {
      attributes: [
        'name', 'languages', 'defaultLanguage', 'areaOfInterest', 'user', 'questions', 'createdAt'
      ],
      questions: {
          attributes: ['type', 'label', 'defaultValue', 'values', 'required']
      },
      name: {
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
