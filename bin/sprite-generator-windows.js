#! node

const path = require('path');
const glob = require('glob');
const fs = require('fs');
const xml2js = require('xml2js');
const parseString = require('xml2js').parseString;
const SVGSpriter = require('svg-sprite');
const File = require('Vinyl');
const mkdirp = require('mkdirp');
const svgToPng = require('svg2png');

const argv = process.argv;

if (argv.length <= 2) {
    console.error('ERROR: 缺少必要参数');
    return;
}

const params = argv.filter((arg, index) => {
    return index >= 2;
});

const sourceDirUrl = params[0];
const targetDirUrl = params[1];

if (!sourceDirUrl) {
    console.error('ERROR: 请指定资源文件夹');
    return;
}

if (!targetDirUrl) {
    console.error('ERROR: 请指定目标文件夹');
    return;
}

const sourceDirPath = path.resolve(sourceDirUrl);
const targetDirPath = path.resolve(targetDirUrl);

/**
 * @constant
 */
const spriteFileConfig = [
    {
        ratio: 1,
        fileName: 'sprite'
    },
    {
        ratio: 2,
        fileName: 'sprite@2x'
    },
    {
        ratio: 3,
        fileName: 'sprite@3x'
    },
    {
        ratio: 4,
        fileName: 'sprite@4x'
    }
];
const svgSpriterConfig = {
    dest: 'out',
    mode: {
        css: {}
    }
};
const cwd = path.resolve(sourceDirPath);

/**
 * @function main
 */
glob.glob('**/*.svg', { cwd, cwd }, function (err, files) {

    if (err) return;

    let storage = [];

    files.forEach((file) => {
        let item = {
            fileName: file,
            path: path.join(cwd, file),
            base: cwd,
            contents: fs.readFileSync(path.join(cwd, file))
        };
        storage.push(item);
    });

    spriteFileConfig.forEach((item) => {

        let translateArray = [];

        storage.forEach((file) => {
            translateArray.push(translateRetina(file.contents, item.ratio));
        });

        Promise.all(translateArray)
            .then((result) => {

                let compileConfig = {
                    fileName: item.fileName,
                    ratio: item.ratio,
                    spriterConfig: []
                };

                storage.forEach((file, index) => {

                    let spriterConfigItem = {
                        fileName: file.fileName,
                        path: file.path,
                        base: file.base,
                        contents: result[index]
                    };

                    compileConfig.spriterConfig.push(spriterConfigItem);

                });

                return compileConfig;

            })
            .then((config) => {
                compile(config)
                    .then((result) => {
                        build(result.buffer, result.dir, result.config);
                    })
                    .catch(() => {

                    });
            })
            .catch((err) => {
                console.log(err);
            });

    });

});

/**
 * @function translateRetina
 * @param buffer
 * @param ratio
 */
function translateRetina(buffer, ratio) {
    return new Promise((resolve, reject) => {
        parseString(buffer.toString(), function (err, xml) {

            if (err) reject(err);

            let width = xml.svg['$'].width.replace('px', '');
            let height = xml.svg['$'].height.replace('px', '');

            xml.svg['$'].width = parseFloat(width) * ratio + 'px';
            xml.svg['$'].height = parseFloat(height) * ratio + 'px';

            let builder = new xml2js.Builder();

            let newXml = builder.buildObject(xml);

            let newXmlBuffer = new Buffer(newXml);

            resolve(newXmlBuffer);

        });
    });
}

/**
 * @function compile
 */
function compile(config) {

    let spriter = new SVGSpriter(svgSpriterConfig);

    config.spriterConfig.forEach((item) => {

        spriter.add(new File({
            path: item.path,
            base: item.base,
            contents: item.contents
        }));

    });

    return new Promise((resolve, reject) => {

        spriter.compile(function (err, result, data) {

            if (err) reject(err);

            let buffer = result.css.sprite.contents;
            let dir = path.resolve(targetDirPath);

            resolve({
                buffer: buffer,
                dir: dir,
                config: config
            });

        });

    });

}

/**
 * @function build
 */
function build(buffer, dir, config) {

    return new Promise((resolve, reject) => {
        parseString(buffer.toString(), function (error, xmls) {

            if (error) reject(error);

            let outputResult = {};

            xmls.svg.svg.forEach((item) => {

                let obj = item['$'];

                outputResult[obj.id] = {
                    width: obj.width ? parseInt(obj.width) : 0,
                    height: obj.height ? parseInt(obj.height) : 0,
                    x: obj.x ? parseInt(obj.x) : 0,
                    y: obj.y ? parseInt(obj.y) : 0,
                    pixelRatio: config.ratio,
                    sdf: false
                };

            });

            let pngPath = path.resolve(targetDirPath + '/' + config.fileName + '.png');
            let jsonPath = path.resolve(targetDirPath + '/' + config.fileName + '.json');

            let pngBuffer = svgToPng.sync(buffer);

            mkdirp.sync(dir);

            fs.writeFileSync(pngPath, pngBuffer);
            console.log(`${config.fileName}.png is already written`);

            fs.writeFileSync(jsonPath, JSON.stringify(outputResult));
            console.log(`${config.fileName}.json is already written`);

            resolve();

        });
    });

}