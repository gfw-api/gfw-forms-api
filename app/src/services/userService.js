const logger = require('logger');
const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const ctRegisterMicroservice = require('ct-register-microservice-node');

const deserializer = function (obj) {
    return function (callback) {
        new JSONAPIDeserializer({ keyForAttribute: 'camelCase' }).deserialize(obj, callback);
    };
};

class UserService {

    * getUserLanguage(loggedUser) {
        if (loggedUser) {
            logger.info('Obtaining user', `/user/${loggedUser.id}`);
            try {
                const result = yield ctRegisterMicroservice.requestToMicroservice({
                    uri: `/user/${loggedUser.id}`,
                    method: 'GET',
                    json: true
                });
                const user = yield deserializer(result);
                if (user && user.language) {
                    const language = user.language.toLowerCase().replace(/_/g, '-');
                    logger.info('Setting user language to send email', language);
                    return language;
                }
            } catch (e) {
                logger.error('error obtaining user, default lang en', e);
                return 'en';

            }
        }
        logger.info('User not logged, default lang en');
        return 'en';
    }

}

module.exports = new UserService();
