/* eslint-disable consistent-return,class-methods-use-this */
const config = require('config');
const logger = require('logger');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const CONTACT_US_SHEET_INDEX = 1;
const REQUEST_WEBINAR_SHEET_TITLE = 'Webinar Requests';

class GoogleSheetsService {

    constructor() {
        this.creds = config.get('googleSheets');
        this.doc = new GoogleSpreadsheet(this.creds.target_sheet_id);
    }

    async authSheets() {
        return this.doc.useServiceAccountAuth({
            private_key: this.creds.private_key.replace(/\\n/g, '\n'),
            client_email: this.creds.client_email,
        });
    }

    async updateSheet(user) {
        try {
            await this.authSheets();

            // Load cells
            await this.doc.loadInfo();
            const sheet = await this.doc.sheetsByIndex[CONTACT_US_SHEET_INDEX];
            await sheet.loadCells();

            for (let i = 0; i < sheet.rowCount; i++) {
                const cell = await sheet.getCell(i, 5);
                if (cell.value === user.email) {
                    logger.info('User already exists. Updating....');
                    return this.updateCells(cell, user);
                }
            }

            if (user.signup === 'true') {
                logger.info('User does not exist. Adding....');
                const newRow = {
                    agreed_to_test: 'yes',
                    'Date First Added': this.getDate(),
                    Email: user.email,
                    Source: 'GFW Feedback Form'
                };

                return sheet.addRow(newRow);
            }
        } catch (err) {
            logger.error(err);
        }
    }

    async updateCells(row, user) {
        try {
            logger.info('Getting user....');
            const sheet = await this.doc.sheetsByIndex[CONTACT_US_SHEET_INDEX];
            const rows = sheet.getRows({ offset: row.row - 1, limit: 1 });
            logger.info('Found user....');
            rows[0].source = 'GFW Feedback form';
            rows[0].agreedtotest = user.signup === 'true' ? 'yes' : 'no';
            await rows[0].save();
            logger.info('User updated');
            return rows;
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

    async requestWebinar(data) {
        try {
            // Auth using promises
            await this.authSheets();
            logger.info('[GoogleSheetsService] Adding a new webinar request...');

            await this.doc.loadInfo();
            const sheet = this.doc.sheetsByTitle[REQUEST_WEBINAR_SHEET_TITLE];
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
