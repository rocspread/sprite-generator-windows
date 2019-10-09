
const tagReg = /((\<svg )(.+)\>)/;
const widthReg = /(width=\")([0-9]+)(px\")/;
const heightReg = /(height=\")([0-9]+)(px\")/;
const viewboxReg = /(viewBox=\")([0-9]| )+(\")/;

const translateRatio = function (buffer, ratio) {

    const string = buffer.toString();

    // 匹配svg标签
    const tagMatch = string.match(tagReg);
    if (!tagMatch) {
        return {
            error: new Error('标签匹配失败'),
            result: null
        };
    }
    const tagStr = tagMatch[0];

    // 匹配宽度
    const widthMatch = tagStr.match(widthReg);
    if (!widthMatch) {
        return {
            error: new Error('宽度匹配失败'),
            result: null
        };
    }
    const widthStr = widthMatch[0];

    // 匹配高度
    const heightMatch = tagStr.match(heightReg);
    if (!heightMatch) {
        return {
            error: new Error('高度匹配失败'),
            result: null
        };
    }
    const heightStr = heightMatch[0];

    // 取值 宽度
    const widthValue = parseFloat(widthStr
        .replace('width="', '')
        .replace('px"', ''));
    // 取值 高度
    const heightValue = parseFloat(heightStr
        .replace('height="', '')
        .replace('px"', ''));

    const width = widthValue * ratio;
    const height = heightValue * ratio;
    const tagReverse = tagStr
        .replace(widthReg, `width="${width}px"`)
        .replace(heightReg, `height="${height}px"`);
        // .replace(viewboxReg, `viewBox="0 0 ${width} ${height}"`);
    const svgReverse = string.replace(tagReg, tagReverse);

    return {
        error: null,
        result: Buffer.from(svgReverse)
    }

}

module.exports = translateRatio;