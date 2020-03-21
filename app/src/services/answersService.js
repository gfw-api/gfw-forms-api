const AnswersModel = require('models/answersModel');
const { ObjectId } = require('mongoose').Types;

class AnswersService {

    static* getAllAnswers({
        reportId, template, loggedUser, team, query
    }) {
        let filter = {};
        let currentManager = false;
        const confirmedUsers = [];
        if (team) {
            // check team
            currentManager = team.managers.filter((manager) => loggedUser.id === manager.id);
            // check confirmed users
            if (team.confirmedUsers.length) {
                team.confirmedUsers.forEach((user) => {
                    confirmedUsers.push(new ObjectId(user.id));
                });
            }
        }

        // Admin users and owners of the report can check all answers
        if (loggedUser.role === 'ADMIN' || loggedUser.id === template.user) {
            filter = {
                $and: [
                    { report: new ObjectId(reportId) },
                ]
            };
        } else if (currentManager && template.public) {
            // managers can check all answers from the default template from his and his team's members
            filter = {
                $and: [
                    { report: new ObjectId(reportId) },
                    {
                        $or: [
                            { user: new ObjectId(loggedUser.id) },
                            {
                                $and: [{ user: { $in: confirmedUsers } }, { areaOfInterest: { $in: team.areas } }]
                            }
                        ]
                    }
                ]
            };
        } else {
            // managers can check all answers from the default template from his and his team's members
            filter = {
                $and: [
                    { report: new ObjectId(reportId) },
                    { user: new ObjectId(loggedUser.id) }
                ]
            };
        }
        if (query) {
            Object.keys(query).forEach((key) => {
                filter.$and.push({ [key]: query[key] });
            });
        }
        return yield AnswersModel.find(filter);
    }

}

module.exports = AnswersService;
