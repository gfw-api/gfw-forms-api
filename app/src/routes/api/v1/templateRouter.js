'use strict';
const Router = require('koa-router');
const logger = require('logger');
const ErrorSerializer = require('serializers/errorSerializer');
const TemplateSerializer = require('serializers/templateSerializer');
const TemplateModel = require('models/templateModel');
const TemplateValidator = require('validators/templateValidator');
const AnswerModel = require('models/answerModel');
const passThrough = require('stream').PassThrough;
const json2csv = require('json2csv');

const router = new Router({
    prefix: '/template',
});

class TemplateRouter {

    static * getAll(){
        logger.info('Obtaining all templates');
        const templateModels = yield TemplateModel.find();
        this.body = TemplateSerializer.serialize(templateModels);
    }

    static * get(){
        logger.info(`Obtaining template with id ${this.params.id}`);
        const template = yield TemplateModel.find({ _id: this.params.id });
        this.body = TemplateSerializer.serialize(template);
    }

    static * save(){
        logger.info('Saving template', this.request.body);
        const request = this.request.body;
        const template = yield new TemplateModel({
            name: request.name,
            areaOfInterest: request.areaOfInterest,
            user: this.state.loggedUser.id,
            languages: request.languages,
            defaultLanguage: request.defaultLanguage,
            questions: request.questions
        }).save();
        this.body = TemplateSerializer.serialize(template);
    }

    static * update(){
        this.throw(500, 'Not implemented');
        return;
    }

    static * delete(){
        logger.info(`Deleting template with id ${this.params.id}`);
        const result = yield TemplateModel.remove({ _id: this.params.id });
        if (!result || !result.result || result.result.ok === 0) {
            this.throw(404, 'Template not found');
            return;
        }
        this.body = '';
        this.statusCode = 204;
    }

    static * downloadAnswers() {
        logger.info(`Download answers of template ${this.params.id}`);
        this.set('Content-disposition', `attachment; filename=${this.params.id}.csv`);
        this.set('Content-type', 'text/csv');
        this.body = passThrough();

        const template = yield TemplateModel.findById(this.params.id);
        const questions = {};
        if (!template) {
            this.throw(404, 'Not found');
            return;
        }
        for (let i = 0, length = template.questions.length; i < length; i++) {
            const question = template.questions[i];
            questions[question.name] = null;
            if (question.childQuestions){
                for (let j = 0, lengthChild =question.childQuestions.length; j < lengthChild; j++ ){
                    questions[question.childQuestions[j].name] = null;
                }
            }
        }
        const answers = yield AnswerModel.find({
            template: this.params.id
        });
        logger.debug('Obtaining data');
        if (answers) {
            logger.debug('Data found!');
            let data = null;

            for (let i = 0, length = answers.length; i < length; i++) {
                const answer = answers[i];
                const responses = Object.assign({}, questions);
                for(let j = 0, lengthResponses = answer.responses.length; j < lengthResponses; j++){
                    const res = answer.responses[j];
                    responses[res.question] = res.value;
                }
                logger.debug('Writting...');
                data = json2csv({
                    data: responses,
                    hasCSVColumnTitle: i === 0
                }) + '\n';
                this.body.write(data);
            }
        }
        this.body.end();
    }

}


function * loggedUserToState(next) {
    if (this.query && this.query.loggedUser){
        this.state.loggedUser = JSON.parse(this.query.loggedUser);
        delete this.query.loggedUser;
    } else if (this.request.body && this.request.body.loggedUser) {
        this.state.loggedUser = this.request.body.loggedUser;
        delete this.request.body.loggedUser;
    } else {
        this.throw(401, 'Not logged');
        return;
    }
    yield next;
}

function * checkPermission(next) {
    if (this.state.loggedUser.role === 'USER' || (this.state.loggedUser.role==='MANAGER' && (!this.state.loggedUser.extraUserData || this.state.loggedUser.extraUserData.apps || this.state.loggedUser.extraUserData.apps.indexOf('gfw') === -1))) {
        this.throw(403, 'Not authorized');
        return;
    }
    yield next;
}

function* checkAdmin(next) {
    if (!this.state.loggedUser || this.state.loggedUser.role !== 'ADMIN') {
        this.throw(403, 'Not authorized');
        return;
    }
    yield next;
}

router.post('/', loggedUserToState, TemplateValidator.create, TemplateRouter.save);
router.patch('/:id', loggedUserToState, checkPermission, TemplateValidator.update, TemplateRouter.update);
router.get('/', loggedUserToState, TemplateRouter.getAll);
router.get('/:id', loggedUserToState, TemplateRouter.get);
router.delete('/:id', loggedUserToState, checkPermission, TemplateRouter.delete);
router.get('/:id/download-answers', loggedUserToState, checkAdmin, TemplateRouter.downloadAnswers);

module.exports = router;
