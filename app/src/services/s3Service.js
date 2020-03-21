const logger = require('logger');
const AWS = require('aws-sdk');
const fs = require('fs');
const config = require('config');
const uuidV4 = require('uuid/v4');

AWS.config.update({
    accessKeyId: config.get('s3.accessKeyId'),
    secretAccessKey: config.get('s3.secretAccessKey')
});

class S3Service {

    constructor() {
        this.s3 = new AWS.S3();
    }

    // eslint-disable-next-line class-methods-use-this
    getExtension(name) {
        const parts = name.split('.');
        return parts[parts.length - 1];
    }

    // eslint-disable-next-line require-yield
    * uploadFile(filePath, name) {
        logger.info(`Uploading file ${filePath}`);
        const ext = this.getExtension(name);
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    reject(err);
                }
                const uuid = uuidV4();
                // eslint-disable-next-line no-buffer-constructor
                const base64data = new Buffer(data, 'binary');
                this.s3.upload({
                    Bucket: config.get('s3.bucket'),
                    Key: `${config.get('s3.folder')}/${uuid}.${ext}`,
                    Body: base64data,
                    ACL: 'public-read'
                }, (resp) => {
                    if (resp && resp.statusCode >= 300) {
                        logger.error(resp);
                        reject(resp);
                        return;
                    }
                    logger.debug('File uploaded successfully', resp);
                    resolve(`https://s3.amazonaws.com/${config.get('s3.bucket')}/${config.get('s3.folder')}/${uuid}.${ext}`);
                });
            });
        });
    }

}

module.exports = new S3Service();
