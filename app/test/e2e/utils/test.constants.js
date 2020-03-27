const config = require('config');

const ROLES = {
    USER: {
        id: '1a10d7c6e0a37126611fd7a7',
        role: 'USER',
        provider: 'local',
        email: 'rootikaleks@gmail.com',
        extraUserData: {
            apps: [
                'rw',
                'gfw',
                'gfw-climate',
                'prep',
                'aqueduct',
                'forest-atlas',
                'data4sdgs'
            ]
        }
    },
    MANAGER: {
        id: '1a10d7c6e0a37126611fd7a7',
        role: 'MANAGER',
        provider: 'local',
        email: 'user@control-tower.org',
        extraUserData: {
            apps: [
                'rw',
                'gfw',
                'gfw-climate',
                'prep',
                'aqueduct',
                'forest-atlas',
                'data4sdgs'
            ]
        }
    },
    ADMIN: {
        id: '1a10d7c6e0a37126611fd7a7',
        role: 'ADMIN',
        provider: 'local',
        email: 'user@control-tower.org',
        extraUserData: {
            apps: [
                'rw',
                'gfw',
                'gfw-climate',
                'prep',
                'aqueduct',
                'forest-atlas',
                'data4sdgs'
            ]
        }
    }
};

const SPREADSHEET_LIST_REPLY = `<?xml version='1.0' encoding='UTF-8'?><feed xmlns='http://www.w3.org/2005/Atom' xmlns:openSearch='http://a9.com/-/spec/opensearch/1.1/' xmlns:gsx='http://schemas.google.com/spreadsheets/2006/extended'><id>https://spreadsheets.google.com/feeds/list/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full</id><updated>2020-03-27T11:15:40.864Z</updated><category scheme='http://schemas.google.com/spreadsheets/2006' term='http://schemas.google.com/spreadsheets/2006#list'/><title>Official GFW Testers</title><link rel='alternate' type='application/atom+xml' href='https://docs.google.com/spreadsheets/d/1oCRTDUlaaadA_xVCWTQ9BaCLxY8do0uSQYGLXu0fQ1k/edit'/><link rel='http://schemas.google.com/g/2005#feed' type='application/atom+xml' href='https://spreadsheets.google.com/feeds/list/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full'/><link rel='http://schemas.google.com/g/2005#post' type='application/atom+xml' href='https://spreadsheets.google.com/feeds/list/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full'/><link rel='self' type='application/atom+xml' href='https://spreadsheets.google.com/feeds/list/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full?start-index=1989&amp;max-results=1'/><link rel='previous' type='application/atom+xml' href='https://spreadsheets.google.com/feeds/list/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full?start-index=1988&amp;max-results=1'/><author><name>alyssakbarrett</name><email>alyssakbarrett@gmail.com</email></author><openSearch:totalResults>1989</openSearch:totalResults><openSearch:startIndex>1989</openSearch:startIndex><openSearch:itemsPerPage>1</openSearch:itemsPerPage><entry xmlns:gd='http://schemas.google.com/g/2005' gd:etag='&quot;RV8YUxgiZyt7ImBtW01TTA..&quot;'><id>https://spreadsheets.google.com/feeds/list/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/1syty7</id><updated>2020-03-27T11:15:40.864Z</updated><app:edited xmlns:app='http://www.w3.org/2007/app'>2020-03-27T11:15:40.864Z</app:edited><category scheme='http://schemas.google.com/spreadsheets/2006' term='http://schemas.google.com/spreadsheets/2006#list'/><title>3/27/20</title><content>email: test@gmail.com, source: GFW Feedback form, agreedtotest: no</content><link rel='self' type='application/atom+xml' href='https://spreadsheets.google.com/feeds/list/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full/1syty7'/><link rel='edit' type='application/atom+xml' href='https://spreadsheets.google.com/feeds/list/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full/1syty7'/><gsx:datefirstadded>3/27/20</gsx:datefirstadded><gsx:first></gsx:first><gsx:last></gsx:last><gsx:title></gsx:title><gsx:email>test@gmail.com</gsx:email><gsx:otheremail></gsx:otheremail><gsx:phone></gsx:phone><gsx:skype></gsx:skype><gsx:addresslocation></gsx:addresslocation><gsx:organizationsector></gsx:organizationsector><gsx:positionprimaryresponsibilities></gsx:positionprimaryresponsibilities><gsx:source>GFW Feedback form</gsx:source><gsx:otherhowdoyouuseorplantousegfw></gsx:otherhowdoyouuseorplantousegfw><gsx:dateaskedtotest></gsx:dateaskedtotest><gsx:testdatetype></gsx:testdatetype><gsx:testdatetype_2></gsx:testdatetype_2><gsx:testdatetype_3></gsx:testdatetype_3><gsx:testdatetype_4></gsx:testdatetype_4><gsx:agreedtotest>no</gsx:agreedtotest><gsx:userkey></gsx:userkey></entry></feed>`;


const SPREADSHEET_CELLS_REPLY = `<?xml version='1.0' encoding='UTF-8'?><feed xmlns='http://www.w3.org/2005/Atom' xmlns:openSearch='http://a9.com/-/spec/opensearch/1.1/' xmlns:gs='http://schemas.google.com/spreadsheets/2006'><id>https://spreadsheets.google.com/feeds/cells/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full</id><updated>2020-03-26T15:31:02.627Z</updated><category scheme='http://schemas.google.com/spreadsheets/2006' term='http://schemas.google.com/spreadsheets/2006#cell'/><title>Official GFW Testers</title><link rel='alternate' type='application/atom+xml' href='https://docs.google.com/spreadsheets/d/${config.get('googleSheets.target_sheet_id')}/edit'/><link rel='http://schemas.google.com/g/2005#feed' type='application/atom+xml' href='https://spreadsheets.google.com/feeds/cells/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full'/><link rel='http://schemas.google.com/g/2005#post' type='application/atom+xml' href='https://spreadsheets.google.com/feeds/cells/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full'/><link rel='http://schemas.google.com/g/2005#batch' type='application/atom+xml' href='https://spreadsheets.google.com/feeds/cells/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full/batch'/><link rel='self' type='application/atom+xml' href='https://spreadsheets.google.com/feeds/cells/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full?max-col=5&amp;min-col=5'/><author><name>alyssakbarrett</name><email>alyssakbarrett@gmail.com</email></author><openSearch:totalResults>1371</openSearch:totalResults><openSearch:startIndex>1</openSearch:startIndex><gs:rowCount>2</gs:rowCount><gs:colCount>35</gs:colCount><entry xmlns:gd='http://schemas.google.com/g/2005' gd:etag='&quot;YD5eUBZLHit7Ig..&quot;'><id>https://spreadsheets.google.com/feeds/cells/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/R1C5</id><updated>2020-03-26T15:31:02.627Z</updated><app:edited xmlns:app='http://www.w3.org/2007/app'>2020-03-26T15:31:02.627Z</app:edited><category scheme='http://schemas.google.com/spreadsheets/2006' term='http://schemas.google.com/spreadsheets/2006#cell'/><title>E1</title><content>Email</content><link rel='self' type='application/atom+xml' href='https://spreadsheets.google.com/feeds/cells/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full/R1C5'/><link rel='edit' type='application/atom+xml' href='https://spreadsheets.google.com/feeds/cells/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full/R1C5'/><gs:cell row='1' col='5' inputValue='Email'>Email</gs:cell></entry><entry xmlns:gd='http://schemas.google.com/g/2005' gd:etag='&quot;YHgQXhYWHyt7Ig..&quot;'><id>https://spreadsheets.google.com/feeds/cells/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/R2C5</id><updated>2020-03-26T15:31:02.627Z</updated><app:edited xmlns:app='http://www.w3.org/2007/app'>2020-03-26T15:31:02.627Z</app:edited><category scheme='http://schemas.google.com/spreadsheets/2006' term='http://schemas.google.com/spreadsheets/2006#cell'/><title>E2</title><content>arianaalisjahbana@gmail.com</content><link rel='self' type='application/atom+xml' href='https://spreadsheets.google.com/feeds/cells/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full/R2C5'/><link rel='edit' type='application/atom+xml' href='https://spreadsheets.google.com/feeds/cells/${config.get('googleSheets.target_sheet_id')}/${config.get('googleSheets.target_sheet_index')}/private/full/R2C5'/><gs:cell row='2' col='5' inputValue='test@gmail.com'>test@gmail.com</gs:cell></entry></feed>`;

module.exports = {
    ROLES,
    SPREADSHEET_CELLS_REPLY,
    SPREADSHEET_LIST_REPLY
};
