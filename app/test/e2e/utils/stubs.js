const GoogleSheetsService = require('services/googleSheetsService');

const stubGoogleSpreadsheet = (s) => {
    s.stub(GoogleSheetsService, 'authSheets').callsFake(() => new Promise((resolve) => resolve()));
    s.stub(GoogleSheetsService, 'checkRows').callsFake(() => new Promise((resolve) => resolve()));
    s.stub(GoogleSheetsService, 'updateSheet').callsFake(() => new Promise((resolve) => resolve()));
};

module.exports = {
    stubGoogleSpreadsheet,
};
