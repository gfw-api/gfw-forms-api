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

    getExtension(name) {
        const parts = name.split('.');
        return parts[parts.length -1];
    }

    * uploadFile(filePath, name) {
        logger.info(`Uploading file ${filePath}`);
        const ext = this.getExtension(name);
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    reject(err);
                }
                const uuid = uuidV4();
                var base64data = new Buffer(data, 'binary');
                this.s3.upload({
                    Bucket: config.get('s3.bucket'),
                    Key: `forest-watcher/${uuid}.${ext}`,
                    Body: base64data,
                    ACL: 'public-read'
                }, function (resp) {
                    if (resp && resp.statusCode >= 300){
                        logger.error(resp);
                        reject(resp);
                        return;
                    }
                    logger.debug('File uploaded successfully', resp);
                    resolve(`https://s3.amazonaws.com/${config.get('s3.bucket')}/forest-watcher/${uuid}.${ext}`);
                });
            });
        });
    }
}

module.exports = new S3Service();
