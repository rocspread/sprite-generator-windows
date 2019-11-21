const glob = require('glob');
const fs = require('fs');
const SVGSpriter = require('svg-sprite');
const readFiles = require('./read-files');
const File = require('Vinyl');
const parseString = require('xml2js').parseString;
const mkdirp = require('mkdirp');
const { convert } = require('convert-svg-to-png');
const sd = require('silly-datetime');

const RATIOES = require('./configs/ratios');
const SVG_SPRITER_CONFIG = require('./configs/svg_spriter_config');
const translateRatio = require('./translate-ratio');
const TaskQueue = require('./utils/task_queue');

const SpriteGenerator = async function (source, target) {

    const names = await readSvgs(source);
    const readFilesResult = readFiles(names, source);

    if (readFilesResult.error) return; // 提示信息在read-file文件中

    const data = readFilesResult.result; // { name: '', path: '', buffer: '' }[]

    mkdirp.sync(target);

    const taskQueue = new TaskQueue();

    RATIOES.map(ratio => {
        taskQueue.add(spriterCompile(data, ratio, source, target));
    });

    taskQueue.run();

};

/**
 * compile entrance
 */
function spriterCompile(data, ratio, source, target) {
    return async function () {

        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
        console.log(sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'), `sprite@${ratio}x 编译开始...`);

        const spriter = new SVGSpriter(SVG_SPRITER_CONFIG);

        for (const item of data) {
            const { name, path, buffer } = item;
            const translated = translateRatio(buffer, ratio);

            if (translated.error) {
                console.log(sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'), `sprite@${ratio}x ${name} 转换失败...`);
                return;
            }

            spriter.add(new File({
                path: path,
                base: source,
                contents: translated.result
            }));
        }

        console.log(sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'), `sprite@${ratio}x 数据填充成功`);

        const compileResult = await compile(spriter);

        if (compileResult.error) {
            console.log(sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'), `sprite@${ratio}x 编译失败...`);
            return;
        }

        console.log(sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'), `sprite@${ratio}x 编译成功...`);

        const svgBuffer = compileResult.result;
        const svgString = svgBuffer.toString();

        const buildJsonResult = await buildJson(svgString, ratio);

        if (buildJsonResult.error) {
            console.log(sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'), `sprite@${ratio}x 构建JSON配置失败...`);
            return;
        }

        console.log(sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'), `sprite@${ratio}x 构建JSON配置成功...`);

        const jsonString = buildJsonResult.result;
        const pngBuffer = await svgToPng(svgBuffer);

        console.log(sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'), `sprite@${ratio}x svg -> png 成功...`);

        const spriteName = ratio === 1 ? 'sprite' : 'sprite@' + ratio + 'x';
        const pngPath = target + '\\' + spriteName + '.png';
        const jsonPath = target + '\\' + spriteName + '.json';

        fs.writeFileSync(pngPath, pngBuffer, {
            encoding: 'utf8'
        });

        fs.writeFileSync(jsonPath, jsonString, {
            encoding: 'utf8'
        });

        console.log(sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'), `sprite@${ratio}x 雪碧图构建成功...`);
    }
}

/**
 * build json
 */
async function buildJson(str, ratio) {
    return new Promise(async resolve => {
        parseString(str, function (err, xmls) {
            if (err) {
                resolve({ error: new Error('构建JSON配置失败...'), result: null });
                return;
            }
            resolve({
                error: null,
                result: JSON.stringify(xmls.svg.svg.reduce((reducer, current) => {
                    const svg = current['$'];
                    const id = svg.id;
                    const width = svg.width ? parseInt(svg.width) : 0;
                    const height = svg.height ? parseInt(svg.height) : 0;
                    const x = svg.x ? parseInt(svg.x) : 0;
                    const y = svg.y ? parseInt(svg.y) : 0;
                    reducer[id] = {
                        width: width,
                        height: height,
                        x: x,
                        y: y,
                        pixelRatio: ratio,
                        sdf: false
                    };
                    return reducer;
                }, {}))
            });
        });
    });
}

/**
 * compile
 */
async function compile(spriter) {
    return new Promise(async resolve => {
        spriter.compile((err, res) => {
            resolve(
                err
                    ? { error: new Error('编译失败'), result: null }
                    : { error: null, result: res.css.sprite.contents }
            );
        });
    });
}

/**
 * read svgs
 */
async function readSvgs(source) {
    return new Promise(async resolve => {
        glob.glob('**/*.svg', { cwd: source, cwd: source }, function (err, files) {
            resolve(err ? [] : files);
        });
    });
}

/**
 * svg -> png
 */
async function svgToPng(source) {
    return new Promise(async resolve => {
        const png = await convert(source);
        resolve(png);
    });
}

module.exports = SpriteGenerator;