'use strict';

var Router = require('koa-router');
var logger = require('logger');
var mailService = require('services/mailService');
var config = require('config');
var JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
var router = new Router({
    prefix: '/contribution-data'
});

var deserializer = function(obj) {
    return function(callback) {
        new JSONAPIDeserializer({keyForAttribute: 'camelCase'}).deserialize(obj, callback);
    };
};


class ContributionRouter {
    static * createStory() {
        logger.info('Sending mail');
        logger.debug('Data', this.request.body);

        let wriRecipients = config.get('wriMail.recipients').split(',');
        wriRecipients = wriRecipients.map(function(mail){
            return {
                address: mail
            };
        });
        logger.debug('Sending mail...');
        mailService.sendMail(config.get('wriMail.template'), this.request.body, wriRecipients);

        // send mail to USER
        let language = 'en';
        if (this.request.body.loggedUser) {
            logger.info('Obtaining user', '/user/' + this.request.body.loggedUser.id);
            let result = yield require('vizz.microservice-client').requestToMicroservice({
                uri: '/user/' + this.request.body.loggedUser.id,
                method: 'GET',
                json: true
            });
            if(result.statusCode === 200){
                let user = yield deserializer(result.body);
                if (user.language) {
                    logger.info('Setting user language to send email');
                    language = user.language.toLowerCase().replace(/_/g, '-');
                }
            } else {
                logger.error('error obtaining user', result.body);

            }

        }
        let template = `${config.get('userMail.template')}-${language}`;
        mailService.sendMail(template, this.request.body, [{
            address: this.request.body.data_email
        }]);


        this.body = '';
    }


}

router.post('/', ContributionRouter.createStory);

module.exports = router;
