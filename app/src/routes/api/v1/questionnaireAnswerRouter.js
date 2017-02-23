'use strict';
const Router = require('koa-router');
const logger = require('logger');
const ErrorSerializer = require('serializers/errorSerializer');
const AnswerSerializer = require('serializers/answerSerializer');
const AnswerModel = require('models/answerModel');
const QuestionnaireModel = require('models/questionnaireModel');
const s3Service = require('services/s3Service');

const router = new Router({
    prefix: '/questionnaire/:questionnaireId/answer',
});

class AnswerRouter {

    static * getAll() {
        logger.info('Obtaining all answer');
        const answers = yield AnswerModel.find({
            user: this.state.loggedUser.id,
            questionnaire: this.params.questionnaireId
        });
        this.body = AnswerSerializer.serialize(answers);
    }

    static * get() {
        logger.info(`Obtaining answers with id ${this.params.id}`);
        const answer = yield AnswerModel.find({
            user: this.state.loggedUser.id,
            questionnaire: this.params.questionnaire,
            _id: this.params.id
        });
        this.body = AnswerSerializer.serialize(answer);
    }

    static * save() {
        logger.info('Saving questionnaire');
        logger.debug(this.request.body);

        let answer = {
            user: this.state.loggedUser.id,
            questionnaire: this.state.questionnaire._id,
            responses: []
        };

        for (let i = 0, length = this.state.questionnaire.questions.length; i < length; i++) {
            const question = this.state.questionnaire.questions[i];
            let response = null;
            if (question.conditionalQuestions) {
                for (let j = 0, lengthSub = question.conditionalQuestions.length; j < lengthSub; j++) {
                    response = this.request.body.fields[question.conditionalQuestions[j].name] || this.request.body.files[question.conditionalQuestions[j].name];
                    if (!response && question.conditionalQuestions[j].required) {
                        this.throw(400, `${question.label} (${question.name}) required`);
                        return;
                    }
                    if (response) {
                        if (question.type === 'blob') {
                            //upload file
                            response = yield s3Service.uploadFile(response.path, response.name);
                        }
                        answer.responses.push({
                            question: question.conditionalQuestions[j].name,
                            value: response
                        });
                    }
                }
            }
            response = this.request.body.fields[question.name] || this.request.body.files[question.name];
            if (!response && question.required) {
                this.throw(400, `${question.label} (${question.name}) required`);
                return;
            }
            if (response) {
                if (question.type === 'blob') {
                    //upload file
                    response = yield s3Service.uploadFile(response.path, response.name);                    
                }
                answer.responses.push({
                    question: question.name,
                    value: response
                });
            }
        }

        const answerModel = yield new AnswerModel(answer).save();

        this.body = AnswerSerializer.serialize(answerModel);

    }

    static * update() {
        this.throw(500, 'Not implemented');
        return;
    }

    static * delete() {
        logger.info(`Deleting answer with id ${this.params.id}`);
        const result = yield AnswerModel.remove({
            _id: this.params.id,
            userId: this.state.loggedUser.id,
            questionnaire: this.params.questionnaire,
        });
        if (!result || !result.result || result.result.ok === 0) {
            this.throw(404, 'Answer not found');
            return;
        }
        this.body = '';
        this.statusCode = 204;
    }

}


function* loggedUserToState(next) {
    if (this.query && this.query.loggedUser) {
        this.state.loggedUser = JSON.parse(this.query.loggedUser);
        delete this.query.loggedUser;
    } else if (this.request.body && (this.request.body.loggedUser || (this.request.body.fields && this.request.body.fields.loggedUser))) {
        if (this.request.body.loggedUser) {
            this.state.loggedUser = this.request.body.loggedUser;
            delete this.request.body.loggedUser;
        } else if (this.request.body.fields && this.request.body.fields.loggedUser)  {
            this.state.loggedUser = JSON.parse(this.request.body.fields.loggedUser);
            delete this.request.body.fields.loggedUser;
        }
    } else {
        this.throw(401, 'Not logged');
        return;
    }
    yield next;
}

function* checkExistQuestionnaire(next) {
    const questionnaire = yield QuestionnaireModel.findById(this.params.questionnaireId).populate('questions');
    if (!questionnaire) {
        this.throw(404, 'Questionnaire not found');
        return;
    }
    this.state.questionnaire = questionnaire;
    yield next;
}


router.post('/', loggedUserToState, checkExistQuestionnaire, AnswerRouter.save);
router.patch('/:id', loggedUserToState, checkExistQuestionnaire, AnswerRouter.update);
router.get('/', loggedUserToState, checkExistQuestionnaire, AnswerRouter.getAll);
router.get('/:id', loggedUserToState, checkExistQuestionnaire, AnswerRouter.get);
router.delete('/:id', loggedUserToState, checkExistQuestionnaire, AnswerRouter.delete);


module.exports = router;
