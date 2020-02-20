const config = require('config');
const logger = require('logger');
const GoogleSpreadsheet = require('google-spreadsheet');

class GoogleSheetsService {

    constructor() {
        this.creds = config.get('googleSheets');
        this.doc = new GoogleSpreadsheet(this.creds.target_sheet_id);
    }

    * authSheets(creds) {
        return new Promise(((resolve, reject) => {
            const creds = {
                private_key: this.creds.private_key.replace(/\\n/g, '\n'),
                client_email: this.creds.client_email
            };
            this.doc.useServiceAccountAuth(creds, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        }));
    }

    * updateSheet(user) {
        try {
            yield this.authSheets(this.creds);
            const result = yield this.checkRows();
            for (let i = 0; i < result.length; i++) {
                if (result[i]._value === user.email) {
                    logger.info('User already exists. Updating....');
                    yield this.updateCells(result[i], user);
                    return;
                }
            }
            if (user.signup === 'true') {
                logger.info('User does not exist. Adding....');
                return new Promise(((resolve, reject) => {
                    const newRow = {
                        agreed_to_test: 'yes',
                        'Date First Added': this.getDate(),
                        Email: user.email,
                        Source: 'GFW Feedback Form'
                    };
                    this.doc.addRow(this.creds.target_sheet_index, newRow, (err, result) => {
                        if (err) {
                            return reject(err);
                        }
                        logger.info('Added row in spreedsheet');
                        resolve(result);
                    });
                }));
            }
        } catch (err) {
            logger.error(err);
        }
    }

    * updateCells(row, user) {
        try {
            logger.info('Getting user....');
            return new Promise(((resolve, reject) => {
                this.doc.getRows(this.creds.target_sheet_index, {
                    offset: row.row - 1,
                    limit: 1
                }, (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    logger.info('Found user....');
                    row[0].source = 'GFW Feedback form';
                    row[0].agreedtotest = user.signup === 'true' ? 'yes' : 'no';
                    row[0].save(() => {
                        logger.info('User updated');
                        resolve(row);
                    });
                });
            }));
        } catch (err) {
            logger.debug(err);
        }
    }

    * checkRows() {
        try {
            logger.debug('checking rows....');
            return new Promise(((resolve, reject) => {
                this.doc.getCells(this.creds.target_sheet_index, {
                    'min-col': 5,
                    'max-col': 5
                }, (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(result);
                });
            }));
        } catch (err) {
            logger.debug(err);
        }
    }

    getDate() {
        let today = new Date();
        let dd = today.getDate();
        let mm = today.getMonth() + 1; // January is 0!

        const yyyy = today.getFullYear();
        if (dd < 10) {
            dd = `0${dd}`;
        }
        if (mm < 10) {
            mm = `0${mm}`;
        }
        today = `${mm}/${dd}/${yyyy}`;
        return today;
    }

}

module.exports = new GoogleSheetsService();
