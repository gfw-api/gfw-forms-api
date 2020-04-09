var Router = require('koa-router');
var logger = require('logger');
var mailService = require('services/mailService');
var userService = require('services/userService');
var googleSheetsService = require('services/googleSheetsService');
var config = require('config');
var JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
var router = new Router({
    prefix: '/form'
});

class FormRouter {
    static * addContribution() {
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
        logger.debug('Getting user language...');
        const language = yield userService.getUserLanguage(this.request.body.loggedUser);
        logger.debug('Sending mail to user...');
        let template = `${config.get('userMail.template')}-${language}`;
        mailService.sendMail(template, this.request.body, [{
            address: this.request.body.data_email
        }]);


        this.body = '';
    }

    static * addFeedback() {
        logger.info('Sending mail');
        const { topic, tool } = this.request.body;
        const mailParams = config.get('contactEmail');
        const topicObj = mailParams.topics[topic || 'general-inquiry'];
        const toolObj = mailParams.tools[tool || 'not-applicable'];
        const mailData = {
          user_email: this.request.body.email,
          message: this.request.body.message,
          topic: topicObj.name,
          tool: toolObj.name,
          opt_in: this.request.body.signup,
          subject: `Contact form: ${topicObj.name} for ${toolObj.name}`
        };
        logger.debug('Mail data', mailData);

        const emails = mailParams.tools[tool];
        let wriRecipients = emails.emailTo.split(',');
        wriRecipients = wriRecipients.map(function(mail) {
            return {
                address: mail
            };
        });

        // send mail to recipient
        logger.debug('Sending mail...');
        mailService.sendMail(mailParams.template, mailData, wriRecipients);

        // send mail to user
        logger.debug('Getting user language...');
        let language = 'en';
        if (this.request.body.language){
            language = this.request.body.language.toLowerCase().replace('_','-');
        }

        const template = `${mailParams.templateConfirm}-${language}`;
        logger.debug('Sending mail to user with template ', template);
        mailService.sendMail(template, mailData, [{
            address: this.request.body.email
        }]);

        // Update Google SpreadSheet for beta users
        try {
            yield googleSheetsService.updateSheet(this.request.body);
        } catch (err) {
            logger.error(err);
        }

        this.body = '';
    }


}

router.post('/contribution-data', FormRouter.addContribution);
router.post('/contact-us', FormRouter.addFeedback);

module.exports = router;
