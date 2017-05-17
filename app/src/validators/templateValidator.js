const logger = require('logger');
const ErrorSerializer = require('serializers/errorSerializer');

class TemplateValidator {
    static * create(next) {
        logger.debug('Validating body for create template');
        logger.debug(this.request.body);
        this.checkBody('name').notEmpty().len(2, 100);
        this.checkBody('questions').notEmpty();

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
