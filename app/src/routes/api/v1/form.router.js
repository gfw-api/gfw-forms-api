const Router = require('koa-router');
const logger = require('logger');
const mailService = require('services/mailService');
const userService = require('services/userService');
const googleSheetsService = require('services/googleSheetsService');
const config = require('config');

const router = new Router({
    prefix: '/form'
});

class FormRouter {

    static* addContribution() {
        logger.info('Sending mail');
        logger.debug('Data', this.request.body);

        let wriRecipients = config.get('wriMail.recipients').split(',');
        wriRecipients = wriRecipients.map((mail) => ({
            address: mail
        }));
        logger.debug('Sending mail...');
        mailService.sendMail(config.get('wriMail.template'), this.request.body, wriRecipients);

        // send mail to USER
        logger.debug('Getting user language...');
        const language = yield userService.getUserLanguage(this.request.body.loggedUser);
        logger.debug('Sending mail to user...');
        const template = `${config.get('userMail.template')}-${language}`;
        mailService.sendMail(template, this.request.body, [{
            address: this.request.body.data_email
        }]);

        this.body = '';
    }

    static async addFeedback() {
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
        wriRecipients = wriRecipients.map((mail) => ({
            address: mail
        }));

        // send mail to recipient
        logger.debug('Sending mail...');
        mailService.sendMail(mailParams.template, mailData, wriRecipients);

        // send mail to user
        logger.debug('Getting user language...');
        let language = 'en';
        if (this.request.body.language) {
            language = this.request.body.language.toLowerCase().replace('_', '-');
        }

        const template = `${mailParams.templateConfirm}-${language}`;
        logger.debug('Sending mail to user with template ', template);
        mailService.sendMail(template, mailData, [{
            address: this.request.body.email
        }]);

        // Update Google SpreadSheet for beta users
        try {
            await googleSheetsService.updateSheet(this.request.body);
        } catch (err) {
            logger.error(err);
        }

        this.body = '';
    }

    static async requestWebinar() {
        logger.info('Requesting webinar');

        const { name, email, request } = this.request.body;
        logger.info(`Name: ${name}, Email: ${email}, Request: ${request}`);

        const validateEmail = (str) => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(str);
        const sendValidationError = (message, code, status = 400) => {
            this.status = status;
            this.body = { errors: [{ detail: message, code }] };
        };

        if (!name) { sendValidationError('Name is required', 'NAME_REQUIRED'); return; }
        if (!email) { sendValidationError('Email is required', 'EMAIL_REQUIRED'); return; }
        if (!validateEmail(email)) { sendValidationError('Email is invalid', 'EMAIL_INVALID'); return; }

        try {
            await googleSheetsService.requestWebinar({ name, email, request });
            this.status = 204;
        } catch (err) {
            logger.error(err);
            this.status = 500;
        }
    }

}

router.post('/contribution-data', FormRouter.addContribution);
router.post('/contact-us', FormRouter.addFeedback);
router.post('/request-webinar', FormRouter.requestWebinar);

module.exports = router;
