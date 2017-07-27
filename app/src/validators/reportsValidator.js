const logger = require('logger');
const ErrorSerializer = require('serializers/errorSerializer');

class ReportsValidator {
    static * create(next) {
        const request = this.request.body;
        logger.debug('Validating body for create template');
        this.checkBody('name').notEmpty();
        this.checkBody('questions').notEmpty();
        this.checkBody('languages').notEmpty();
        this.checkBody('status').notEmpty().isIn(['published', 'unpublished']);

        if (this.errors) {
            this.body = ErrorSerializer.serializeValidationBodyErrors(this.errors);
            this.status = 400;
            return;
        }

        // add custom validation for multilanguage
        const customErrors = [];

        const pushError = (source, detail) => {
            customErrors.push({
                source: detail
            });
        };

        const checkQuestion = (question) => {
            request.languages.forEach((lang) => {
                if (!question.label[lang]) {
                    pushError('name', `Question ${question.name}: label does not match language options`);
                }
                if (question.type === 'text' && question.defaultValue) {
                    if (!question.defaultValue[lang]) {
                        pushError('name', `Question ${question.name}: defaultValue does not match language options`);
                    }
                }
                if (question.type === 'select' || question.type === 'radio' || question.type === 'checkbox') {
                    if (!question.values[lang]) {
                        pushError('name', `Question ${question.name}: values do not match language options`);
                    }
                }
            });
        };

        // check for languages
        if (request.languages.length > 1) {
            if (!request.defaultLanguage || request.languages.indexOf(request.defaultLanguage) === -1 ) {
                pushError('languages', `Languages: values do not match language options`);
            }
        }

        // check template names
        request.languages.forEach((lang) => {
            if (request.name[lang] === undefined) {
                pushError(request.name, 'Report name: values do not match language options');
            }
        });

        // check each question
        request.questions.forEach((question) => {
            checkQuestion(question);
            if (question.childQuestions) {
                question.childQuestions.forEach((childQuestion) => {
                    checkQuestion(childQuestion);
                });
            }
        });

        if (customErrors.length > 0) {
            this.body = ErrorSerializer.serializeValidationBodyErrors(customErrors);
            this.status = 400;
            return;
        }
        yield next;
    }

    static * update(next) {
        const request = this.request.body;
        logger.debug('Validating body for create template');
        this.checkBody('name').notEmpty();
        this.checkBody('defaultLanguage').notEmpty();
        this.checkBody('status').notEmpty().isIn(['published', 'unpublished']);

        if (this.errors) {
            this.body = ErrorSerializer.serializeValidationBodyErrors(this.errors);
            this.status = 400;
            return;
        }

        // add custom validation for multilanguage
        const customErrors = [];

        const pushError = (source, detail) => {
            customErrors.push({
                source: detail
            });
        };

        // check for languages
        if (request.languages.length > 1) {
            if (!request.defaultLanguage || request.languages.indexOf(request.defaultLanguage) === -1 ) {
                pushError('languages', `Languages: values do not match language options`);
            }
        }

        // check template names
        request.languages.forEach((lang) => {
            if (request.name[lang] === undefined) {
                pushError(request.name, 'Report name: values do not match language options');
            }
        });

        if (customErrors.length > 0) {
            this.body = ErrorSerializer.serializeValidationBodyErrors(customErrors);
            this.status = 400;
            return;
        }
        
        yield next;
    }
}

module.exports = ReportsValidator;
