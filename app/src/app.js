const config = require('config');
const logger = require('logger');
const path = require('path');
const convert = require('koa-convert');
const koaSimpleHealthCheck = require('koa-simple-healthcheck');
const koa = require('koa');
const koaLogger = require('koa-logger');
const loader = require('loader');
const ErrorSerializer = require('serializers/errorSerializer');
const { RWAPIMicroservice } = require('rw-api-microservice-node');
const mongoose = require('mongoose');
const sleep = require('sleep');

const mongoUri = process.env.MONGO_URI || (`mongodb://${config.get('mongodb.host')}:${config.get('mongodb.port')}/${config.get('mongodb.database')}`);
mongoose.Promise = Promise;

const koaBody = require('koa-body')({
    multipart: true,
    formidable: {
        uploadDir: '/tmp',
        onFileBegin(name, file) {
            const folder = path.dirname(file.path);
            file.path = path.join(folder, file.name);
        }
    }
});

let retries = 10;

async function init() {
    return new Promise((resolve, reject) => {
        async function onDbReady(err) {
            if (err) {
                if (retries >= 0) {
                    // eslint-disable-next-line no-plusplus
                    retries--;
                    logger.error(`Failed to connect to MongoDB uri ${mongoUri}, retrying...`);
                    sleep.sleep(5);
                    mongoose.connect(mongoUri, onDbReady);
                } else {
                    logger.error('MongoURI', mongoUri);
                    logger.error(err);
                    reject(new Error(err));
                }

                return;
            }

            const app = koa();

            // if environment is dev then load koa-logger
            if (process.env.NODE_ENV === 'dev') {
                app.use(koaLogger());
            }
            app.use(koaBody);

            require('koa-validate')(app);
            // catch errors and send in jsonapi standard. Always return vnd.api+json
            app.use(function* handleErrors(next) {
                try {
                    yield next;
                } catch (inErr) {
                    let error = inErr;
                    try {
                        error = JSON.parse(inErr);
                    } catch (e) {
                        logger.debug('Could not parse error message - is it JSON?: ', inErr);
                        error = inErr;
                    }
                    this.status = error.status || this.status || 500;
                    if (this.status >= 500) {
                        logger.error(error);
                    } else {
                        logger.info(error);
                    }

                    this.body = ErrorSerializer.serializeError(this.status, error.message);
                    if (process.env.NODE_ENV === 'prod' && this.status === 500) {
                        this.body = 'Unexpected error';
                    }
                }
                this.response.type = 'application/vnd.api+json';
            });

            app.use(convert.back(koaSimpleHealthCheck()));

            app.use(convert.back(RWAPIMicroservice.bootstrap({
                name: config.get('service.name'),
                info: require('../microservice/register.json'),
                swagger: require('../microservice/public-swagger.json'),
                logger,
                baseURL: process.env.CT_URL,
                url: process.env.LOCAL_URL,
                token: process.env.CT_TOKEN,
                fastlyEnabled: process.env.FASTLY_ENABLED,
                fastlyServiceId: process.env.FASTLY_SERVICEID,
                fastlyAPIKey: process.env.FASTLY_APIKEY
            })));

            // load routes
            loader.loadRoutes(app);

            // Instance of http module
            const appServer = require('http').Server(app.callback());

            // get port of environment, if not exist obtain of the config.
            // In production environment, the port must be declared in environment variable
            const port = process.env.PORT || config.get('service.port');

            const server = appServer.listen(process.env.PORT, () => {
                if (process.env.CT_REGISTER_MODE === 'auto') {
                    RWAPIMicroservice.register().then(() => {
                        logger.info('CT registration process started');
                        resolve({ app, server });
                    }, (error) => {
                        logger.error(error);
                        process.exit(1);
                    });
                }
            });

            logger.info(`Server started in port:${port}`);
        }

        mongoose.connect(mongoUri)
            .then(onDbReady)
            .catch((err) => {
                logger.error(err);
                throw new Error(err);
            });

    });
}

module.exports = init;
