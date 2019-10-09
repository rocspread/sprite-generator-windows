const glob = require('glob');
const fs = require('fs');
const SVGSpriter = require('svg-sprite');
const readFiles = require('./read-files');
const RATIOES = require('./config').RATIOES;
const SVG_SPRITER_CONFIG = require('./config').SVG_SPRITER_CONFIG;
const File = require('Vinyl');
const parseString = require('xml2js').parseString;
const translateRatio = require('./translate-ratio');
const mkdirp = require('mkdirp');
const { convert } = require('convert-svg-to-png');

const SpriteGenerator = function (source, target) {
    glob.glob('**/*.svg', { cwd: source, cwd: source }, function (err, files) {

        if (err) {
            console.log(`
                文件列表读取失败!
            `);
            return;
        }

        const result = readFiles(files, source);

        if (result.error) return;

        const data = result.result;
        const spriters = RATIOES.map(ratio => {
            return {
                ratio: ratio,
                spriter: new SVGSpriter(SVG_SPRITER_CONFIG)
            };
        });

        /**
         * 分别处理每个svg文件放到spriter编译器中
         */
        data.map(item => {
            const { name, path, buffer } = item;
            spriters.map(sp => {
                const res = translateRatio(buffer, sp.ratio);
                if (res.error) {
                    console.log(`${name} ${error.message}`);
                    return;
                }
                sp.spriter.add(new File({
                    path: path,
                    base: source,
                    contents: res.result
                }));
            });

        });

        // 创建文件夹
        mkdirp.sync(target);

        /**
         * 分别编译四种尺寸
         */
        spriters.map(item => {
            item.spriter.compile((err, res) => {

                if (err) {
                    console.log(`
                        sprite@${item.ratio}编译失败
                    `);
                    return;
                }

                const buffer = res.css.sprite.contents;
                const str = buffer.toString();

                parseString(str, function (err, xmls) {

                    if (err) {
                        console.log('雪碧图获取图标位置失败');
                        return;
                    }

                    const configJson = {};
                    xmls.svg.svg.forEach((svg) => {
                        let obj = svg['$'];
                        configJson[obj.id] = {
                            width: obj.width ? parseInt(obj.width) : 0,
                            height: obj.height ? parseInt(obj.height) : 0,
                            x: obj.x ? parseInt(obj.x) : 0,
                            y: obj.y ? parseInt(obj.y) : 0,
                            pixelRatio: item.ratio,
                            sdf: false
                        };
                    });

                    const spriteName = item.ratio === 1 ? 'sprite' : 'sprite@' + item.ratio + 'x';
                    const pngPath = target + '\\' + spriteName + '.png';
                    const jsonPath = target + '\\' + spriteName + '.json';

                    svgToPng(buffer)
                        .then((pngBuffer) => {
                            fs.writeFile(pngPath, pngBuffer, function () {
                                console.log(`${spriteName}.png is already written`);
                            });
                            fs.writeFile(jsonPath, JSON.stringify(configJson), function () {
                                console.log(`${spriteName}.json is already written`);
                            });
                        })
                        .catch(err => {
                            console.log(err);
                        })

                });

            });
        });

    })
};

function svgToPng(source) {
    return new Promise(async (resolve, reject) => {
        const png = await convert(source);
        resolve(png);
    });
}

module.exports = SpriteGenerator;