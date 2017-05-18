const logger = require('logger');
const ErrorSerializer = require('serializers/errorSerializer');

class TemplateValidator {
    static * create(next) {
        const request = this.request.body;
        logger.debug('Validating body for create template');
        // this.checkBody('name').notEmpty().len(2, 100);
        this.checkBody('questions').notEmpty();
        // this.checkBody('languages').notEmpty();

        if (this.errors) {
            this.body = ErrorSerializer.serializeValidationBodyErrors(this.errors);
            this.status = 400;
            return;
        }

        const customError = [];
        // add custom validation for multilanguage
        const pushError = (source, detail) => {
            // this.errors = {
            //     source: {
            //         parameter: source
            //     },
            //     detail: detail
            // };
        };

        const checkQuestion = (question) => {
            request.languages.forEach((lang) => {
                if (question.label[lang] === undefined) {
                    return false;
                }
                if (question.type === 'text') {
                    if (question.defaultValue[lang] === undefined) {
                        return false;
                    }
                }
                if (question.type === 'select' || question.type === 'radio' || question.type === 'checkbox') {
                    if (!question.values[lang] || question.values[lang] === undefined) {
                        return false;
                    }
                }
            });
        };

        //check for languages
        if (request.languages.length > 1) {
            if (!request.defaultLanguage || request.languages.indexOf(request.defaultLanguage) === -1 ) {
                this.customErrors = {
                    name: 'wrong'
                };
            }
        }

        // check template names
        request.languages.forEach((lang) => {
            if (request.label[lang] === undefined) {
                customErrors.push({
                    label: 'Language ES is required'
                });
            }
        });

        //check each question
        request.questions.forEach((question) => {
            if (!checkQuestion(question)) {
                pushError('name', 'Requires values for each language');
            }

            // check each child question
            if (question.childQuestions) {
                question.childQuestions.forEach((childQuestion) => {
                    if (!checkQuestion(childQuestion)) {
                        pushError('name', 'Requires values for each language');
                    }
                });
            }
        });

        if (this.customErrors) {
            // logger.debug(JSON.stringify(this.customErrors));
            this.body = ErrorSerializer.serializeValidationBodyErrors(this.customErrors);
            this.status = 400;
            return;
        }
        yield next;
    }

    static * update(next) {
        logger.debug('Validating body for update template');
        this.checkBody('name').optional().len(2, 100);
        this.checkBody('questions').optional();

        if (this.errors) {
            this.body = ErrorSerializer.serializeValidationBodyErrors(this.errors);
            this.status = 400;
            return;
        }
        yield next;
    }
}

module.exports = TemplateValidator;
