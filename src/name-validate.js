const NAME_SPACE_REG = require('./config').NAME_SPACE_REG;

const nameValidate = function (name) {
    return NAME_SPACE_REG.test(name);
}

module.exports = nameValidate;