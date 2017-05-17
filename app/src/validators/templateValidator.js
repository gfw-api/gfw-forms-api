const logger = require('logger');
const ErrorSerializer = require('serializers/errorSerializer');

class TemplateValidator {
    static * create(next) {
        logger.debug('Validating body for create template');
        logger.debug(this.request.body);
        this.checkBody('name').notEmpty().len(2, 100);
        this.checkBody('questions').notEmpty();

        // check length of languages array (must have one value min)
        this.checkBody('languages').length();

        //if languages > 1, must have a value and value must be in languages
        this.checkBody('defaultLanguage').length();

        // validate label for all label, must have values and only those in languages (not undefined)

        // if question is type radio/checkbox/select, it must have a default value
        // and values must be validated

        // validate labels for children


        if (this.errors) {
            this.body = ErrorSerializer.serializeValidationBodyErrors(this.errors);
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
