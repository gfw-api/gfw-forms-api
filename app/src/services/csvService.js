class CSVConverter {

    static convert(objArray) {
        const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
        // Assume that the headers of the document are equal to the keys in the JSON object.
        const headers = Object.keys(array[0]);
        const stringWithHeaders = CSVConverter.parseHeaders(headers);
        const parsedString = CSVConverter.parseBody(array, stringWithHeaders);
        return parsedString;
    }

    static parseHeaders(headers) {
        // Push the headers into the CSV string.
        let str = '';
        headers.forEach((item) => {
            str += `${CSVConverter.escapeCommas(item)},`;
        });
        str += '\r\n';
        return str;
    }

    static parseBody(array, str) {
        let value;
        let line;

        array.forEach((item, index) => {
            line = '';
            // eslint-disable-next-line guard-for-in,no-restricted-syntax,no-param-reassign
            for (index in item) {
                if (line !== '') line += ',';
                value = CSVConverter.escapeCommas(item[index]);
                line += value;
            }
            // eslint-disable-next-line no-param-reassign
            str += `${line}\r\n`;
        });
        return str;
    }

    static escapeCommas(value) {
        // eslint-disable-next-line no-useless-escape
        const regex = /\,/;
        if (typeof value === 'string') {
            // If the value contained in the JSON object is a string:
            // Perform a regex test to check and see if the value has a comma already in place and escape the value.
            // e.g. "Smith, Jones" as a value should not be separated two different columns.
            return regex.test(value) ? `"${value}"` : value;
        }
        return value;
    }

}

module.exports = CSVConverter;
