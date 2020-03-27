const logger = require('logger');
const config = require('config');
const ErrorSerializer = require('serializers/errorSerializer');

class FormValidator {

    static* contactUs(next) {
        logger.debug('Validating body for contact us');

        const mailParams = config.get('contactEmail');
        const toolKeys = Object.keys(mailParams.tools);
        const topicKeys = Object.keys(mailParams.topics);

        this.checkBody('tool').notEmpty().isIn(toolKeys);
        this.checkBody('topic').optional().isIn(topicKeys);

        if (this.errors) {
            this.body = ErrorSerializer.serializeValidationBodyErrors(this.errors);
            this.status = 400;
            return;
        }
        yield next;
    }

}

module.exports = FormValidator;
