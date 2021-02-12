const Router = require('koa-router');
const logger = require('logger');
const QuestionnaireSerializer = require('serializers/questionnaireSerializer');
const QuestionnaireModel = require('models/questionnaireModel');
const QuestionnaireValidator = require('validators/questionnaireValidator');
const AnswerModel = require('models/answerModel');
const passThrough = require('stream').PassThrough;
const json2csv = require('json2csv');

const router = new Router({
    prefix: '/questionnaire',
});

class QuestionnaireRouter {

    static* getAll() {
        logger.info('Obtaining all questionnaires');
        const questionnaireModels = yield QuestionnaireModel.find();
        this.body = QuestionnaireSerializer.serialize(questionnaireModels);
    }

    static* get() {
        logger.info(`Obtaining questionnaire with id ${this.params.id}`);
        const questionnaire = yield QuestionnaireModel.find({ _id: this.params.id });
        this.body = QuestionnaireSerializer.serialize(questionnaire);
    }

    static* save() {
        logger.info('Saving questionnaire');
        const questionnaire = yield new QuestionnaireModel({
            name: this.request.body.name,
            questions: this.request.body.questions
        }).save();
        this.body = QuestionnaireSerializer.serialize(questionnaire);
    }

    static update() {
        this.throw(500, 'Not implemented');

    }

    static* delete() {
        logger.info(`Deleting questionnaire with id ${this.params.id}`);
        const result = yield QuestionnaireModel.remove({ _id: this.params.id });
        if (!result || !result.result || result.result.ok === 0) {
            this.throw(404, 'Questionnaire not found');
            return;
        }
        this.body = '';
        this.statusCode = 204;
    }

    static* downloadAnswers() {
        logger.info(`Download answers of questionnaire ${this.params.id}`);
        this.set('Content-disposition', `attachment; filename=${this.params.id}.csv`);
        this.set('Content-type', 'text/csv');
        this.body = passThrough();

        const questionnaire = yield QuestionnaireModel.findById(this.params.id);
        const questions = {};
        if (!questionnaire) {
            this.throw(404, 'Not found');
            return;
        }
        for (let i = 0, { length } = questionnaire.questions; i < length; i++) {
            const question = questionnaire.questions[i];
            questions[question.name] = null;
            if (question.childQuestions) {
                for (let j = 0, lengthChild = question.childQuestions.length; j < lengthChild; j++) {
                    questions[question.childQuestions[j].name] = null;
                }
            }
        }
        const answers = yield AnswerModel.find({
            questionnaire: this.params.id,
            user: this.state.loggedUser.id
        });
        logger.debug('Obtaining data');
        if (answers) {
            logger.debug('Data found!');
            let data = null;

            for (let i = 0, { length } = answers; i < length; i++) {
                const answer = answers[i];
                const responses = { ...questions };
                for (let j = 0, lengthResponses = answer.responses.length; j < lengthResponses; j++) {
                    const res = answer.responses[j];
                    responses[res.question] = res.value;
                }
                logger.debug('Writting...');
                data = `${json2csv({
                    data: responses,
                    hasCSVColumnTitle: i === 0
                })}\n`;
                this.body.write(data);
            }
        }
        this.body.end();
    }

}

function* loggedUserToState(next) {
    if (this.query && this.query.loggedUser) {
        this.state.loggedUser = JSON.parse(this.query.loggedUser);
        delete this.query.loggedUser;
    } else if (this.request.body && this.request.body.loggedUser) {
        this.state.loggedUser = this.request.body.loggedUser;
        delete this.request.body.loggedUser;
    } else {
        this.throw(401, 'Unauthorized');
        return;
    }
    yield next;
}

function* checkPermission(next) {
    if (this.state.loggedUser.role === 'USER') {
        this.throw(403, 'Not authorized');
        return;
    }

    if (
        this.state.loggedUser.role === 'MANAGER' && (
            !this.state.loggedUser.extraUserData
            || this.state.loggedUser.extraUserData.apps
            || this.state.loggedUser.extraUserData.apps.indexOf('gfw') === -1
        )
    ) {
        this.throw(403, 'Not authorized');
        return;
    }

    yield next;
}

function* checkAdmin(next) {
    if (!this.state.loggedUser) {
        this.throw(403, 'Not authorized');
        return;
    }
    yield next;
}

router.post('/', loggedUserToState, QuestionnaireValidator.create, QuestionnaireRouter.save);
router.patch('/:id', loggedUserToState, checkPermission, QuestionnaireValidator.update, QuestionnaireRouter.update);
router.get('/', loggedUserToState, QuestionnaireRouter.getAll);
router.get('/:id', loggedUserToState, QuestionnaireRouter.get);
router.delete('/:id', loggedUserToState, checkPermission, QuestionnaireRouter.delete);
router.get('/:id/download-answers', loggedUserToState, checkAdmin, QuestionnaireRouter.downloadAnswers);

module.exports = router;
