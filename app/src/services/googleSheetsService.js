'use strict';

var config = require('config');
var logger = require('logger');
var GoogleSpreadsheet = require('google-spreadsheet');

class GoogleSheetsService {
    constructor(){
        this.creds = config.get('googleSheets');
        this.doc = new GoogleSpreadsheet(this.creds.target_sheet_id);
    }

    * authSheets(creds){
        return new Promise(function(resolve, reject) {  
            let creds = {
                private_key : this.creds.private_key.replace(/\\n/g, '\n'),
                client_email: this.creds.client_email
            };
            this.doc.useServiceAccountAuth(creds, function(err, result) {
              if (err) {
                return reject(err);
              }
              resolve(result);
            });
        }.bind(this));
    }

    * updateSheet(email){
        try {
            yield this.authSheets(this.creds);
            const result = yield this.checkRows();
            result.forEach( function(row){
              if ( row._value === email ) {
                throw new Error('Matching email alreday in sheet');
              }
            });
            return new Promise(function(resolve, reject) {
                const newRow = {
                    'agreed_to_test': 'yes',
                    'Date First Added': this.getDate(),
                    'Email': email,
                    'Source': 'GFW Feedback Form'
                };
                this.doc.addRow(1, newRow, function(err, result) {
                  if (err) {
                    return reject(err);
                  }
                  logger.info('Added row in spreedsheet');
                  resolve(result);
                });
            }.bind(this));
        } catch (err) {
            logger.error(err);
        }
    }

    * checkRows(){
        try {
            logger.debug('checking rows....');
            return new Promise(function(resolve, reject) {
                this.doc.getCells(1, {
                    'min-col': 5,
                    'max-col': 5
                }, function(err, result) {
                  if (err) {
                    return reject(err);
                  }
                  resolve(result);
                });
            }.bind(this));
        } catch (err) {
           logger.debug(err);
        }
    }

    getDate(){
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; //January is 0!

        var yyyy = today.getFullYear();
        if( dd < 10 ){
            dd = '0' + dd;
        }
        if( mm < 10 ){
            mm = '0' + mm;
        }
        today = mm + '/' + dd + '/' + yyyy;
        return today;
    }

}

module.exports = new GoogleSheetsService();
