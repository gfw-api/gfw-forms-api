'use strict';

var logger = require('logger');
var JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;

var deserializer = function(obj) {
    return function(callback) {
        new JSONAPIDeserializer({keyForAttribute: 'camelCase'}).deserialize(obj, callback);
    };
};

class UserService {

    * getUserLanguage(loggedUser){
        if (loggedUser) {
            logger.info('Obtaining user', '/user/' + loggedUser.id);
            let result = yield require('vizz.microservice-client').requestToMicroservice({
                uri: '/user/' + loggedUser.id,
                method: 'GET',
                json: true
            });
            if(result.statusCode === 200){
                let user = yield deserializer(result.body);
                if (user.language) {
                    const language =  user.language.toLowerCase().replace(/_/g, '-');
                    logger.info('Setting user language to send email', language);
                    return language;
                }
            } else {
                logger.error('error obtaining user, default lang en', result.body);
                return 'en';
            }
        }
        logger.info('User not logged, default lang en');
        return 'en';
    }
}

module.exports = new UserService();
