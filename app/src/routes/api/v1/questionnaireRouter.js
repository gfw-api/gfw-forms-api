'use strict';
const Router = require('koa-router');
const logger = require('logger');
const ErrorSerializer = require('serializers/errorSerializer');
const QuestionnaireSerializer = require('serializers/questionnaireSerializer');
const QuestionnaireModel = require('models/questionnaireModel');
const QuestionnaireValidator = require('validators/questionnaireValidator');

const router = new Router({
    prefix: '/questionnaire',
});

class AreaRouter {

    static * getAll(){
        logger.info('Obtaining all questionnaires');
        const questionnaireModels = yield QuestionnaireModel.find();
        this.body = QuestionnaireSerializer.serialize(questionnaireModels);
    }

    static * get(){
        logger.info(`Obtaining questionnaire with id ${this.params.id}`);
        const questionnaire = yield QuestionnaireModel.find({ _id: this.params.id });
        this.body = QuestionnaireSerializer.serialize(questionnaire);
    }

    static * save(){
        logger.info('Saving questionnaire');
        const questionnaire = yield new QuestionnaireModel({
            name: this.request.body.name,
            questions: this.request.body.questions
        }).save();
        this.body = QuestionnaireSerializer.serialize(questionnaire);
    }

    static * update(){
        this.throw(500, 'Not implemented');
        return;
    }

    static * delete(){
        logger.info(`Deleting questionnaire with id ${this.params.id}`);
        const result = yield QuestionnaireModel.remove({ _id: this.params.id });
        if (!result || !result.result || result.result.ok === 0) {
            this.throw(404, 'Questionnaire not found');
            return;
        }
        this.body = '';
        this.statusCode = 204;
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

router.post('/', loggedUserToState, QuestionnaireValidator.create, AreaRouter.save);
router.patch('/:id', loggedUserToState, checkPermission, QuestionnaireValidator.update, AreaRouter.update);
router.get('/', loggedUserToState, AreaRouter.getAll);
router.get('/:id', loggedUserToState, AreaRouter.get);
router.delete('/:id', loggedUserToState, checkPermission, AreaRouter.delete);

module.exports = router;
