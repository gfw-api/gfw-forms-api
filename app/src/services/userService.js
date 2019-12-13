var logger = require('logger');
var JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const ctRegisterMicroservice = require('ct-register-microservice-node');

var deserializer = function(obj) {
    return function(callback) {
        new JSONAPIDeserializer({keyForAttribute: 'camelCase'}).deserialize(obj, callback);
    };
};

class UserService {

    * getUserLanguage(loggedUser){
        if (loggedUser) {
            logger.info('Obtaining user', '/user/' + loggedUser.id);
            try {
                let result = yield ctRegisterMicroservice.requestToMicroservice({
                    uri: '/user/' + loggedUser.id,
                    method: 'GET',
                    json: true
                });
                let user = yield deserializer(result);
                if (user && user.language) {
                    const language =  user.language.toLowerCase().replace(/_/g, '-');
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
