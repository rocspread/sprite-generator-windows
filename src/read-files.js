const path = require('path');
const fs = require('fs');
const nameValidate = require('./name-validate');

const readFiles = function (names, source) {

    const valid = names.every(name => {
        if (nameValidate(name)) {
            return true;
        } else {
            console.log(`
                ${name}
            `);
            return false;
        }
    });

    if (!valid) {
        console.log(`
            ${'以上文件名称不合法,仅支持字母,数字,下划线和中划线!!'}
        `);
        return { error: new Error('name space is invalid'), result: null };
    }

    return {
        error: null,
        result: names.map(name => {
            const _path = path.join(source, name);
            return {
                name: name,
                path: _path,
                buffer: fs.readFileSync(_path)
            };
        })
    };

}

module.exports = readFiles;