'use strict';

var config = require('config');
var logger = require('logger');
var GoogleSpreadsheet = require('google-spreadsheet');

class GoogleSheetsService {
    constructor(){
        this.doc = new GoogleSpreadsheet('1u6prE2Vv9XZE_xXsh67EoO62K7HAZmMu4tKDw5jgrGc');
        this.creds = config.get('googleSheets');
    }

    * authSheets(creds){
        return new Promise(function(resolve, reject) {
            logger.debug(`doc inside ${this.doc}`);
            logger.debug(`creds ${config.get('googleSheets.private_key')}`);
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
            return new Promise(function(resolve, reject) {
                const newRow = {
                    'email': email
                };
                this.doc.addRow(1, newRow, function(err, result) {
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

}

module.exports = new GoogleSheetsService();
