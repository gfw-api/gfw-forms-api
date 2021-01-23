const { RWAPIMicroservice } = require('rw-api-microservice-node');
const logger = require('logger');

class TeamService {

    static* getTeam(user) {
        let team = {};
        try {
            team = yield RWAPIMicroservice.requestToMicroservice({
                uri: `/v1/teams/user/${user}`,
                method: 'GET',
                json: true
            });

        } catch (e) {
            logger.info('Failed to fetch team');
        }
        if (!team.data) {
            logger.info('User does not belong to a team.');
        }
        return team;
    }

}

module.exports = TeamService;
