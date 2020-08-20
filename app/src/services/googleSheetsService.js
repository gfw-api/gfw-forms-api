/* eslint-disable consistent-return,require-yield */
const config = require('config');
const logger = require('logger');
const { GoogleSpreadsheet } = require('google-spreadsheet');

class GoogleSheetsService {

    constructor() {
        this.creds = config.get('googleSheets');
        this.doc = new GoogleSpreadsheet(this.creds.target_sheet_id);
    }

    * authSheets() {
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
                // eslint-disable-next-line no-underscore-dangle
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
                    this.doc.addRow(this.creds.target_sheet_index, newRow, (err, rowResult) => {
                        if (err) {
                            return reject(err);
                        }
                        logger.info('Added row in spreadsheet');
                        resolve(rowResult);
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
                    // eslint-disable-next-line consistent-return
                }, (err, callbackRow) => {
                    if (err) {
                        return reject(err);
                    }
                    logger.info('Found user....');
                    callbackRow[0].source = 'GFW Feedback form';
                    callbackRow[0].agreedtotest = user.signup === 'true' ? 'yes' : 'no';
                    callbackRow[0].save(() => {
                        logger.info('User updated');
                        resolve(callbackRow);
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

    // eslint-disable-next-line class-methods-use-this
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

    async requestWebinar(data) {
        try {
            // Auth using promises
            await this.doc.useServiceAccountAuth({
                private_key: this.creds.private_key.replace(/\\n/g, '\n'),
                client_email: this.creds.client_email,
            });
            logger.info('[GoogleSheetsService] Adding a new webinar request...');

            await this.doc.loadInfo();
            const sheet = this.doc.sheetsByTitle['Webinar Requests'];
            const rowResult = await sheet.addRow(data);
            logger.info('[GoogleSheetsService] Added new webinar request.');

            return rowResult;
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }

}

module.exports = new GoogleSheetsService();
