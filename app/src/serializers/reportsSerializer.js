'use strict';

var logger = require('logger');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

var reportsSerializer = null;

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
      typeForAttribute: function (attribute) { return attribute; },
      keyForAttribute: 'camelCase'
    });
}

class ReportsSerializer {
  static serialize(data) {
        logger.debug(data);
    if (Array.isArray(data)) {
        let reports = { data: [] };
        data.forEach((report) => {
            const serializedData = createSerializer(report.languages).serialize(report);
            reports.data.push(serializedData.data);
        });
        return reports;
    } else {
        return createSerializer(data.languages).serialize(data);
    }
  }
}

module.exports = ReportsSerializer;
