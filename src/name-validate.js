const NAME_SPACE_REG = require('./configs/name_space_reg');

const nameValidate = function (name) {
    return NAME_SPACE_REG.test(name);
}

module.exports = nameValidate;