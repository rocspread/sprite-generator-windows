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

const reg = /^[A-Za-z0-9-_]+.svg$/;

/**
 * @function main
 */
glob.glob('**/*.svg', { cwd, cwd }, function (err, files) {

    if (err) return;

    let storage = [];

    files.forEach((file) => {
        if (!reg.test(file)) {
            console.log(file);
        }
        let item = {
            fileName: file,
            path: path.join(cwd, file),
            base: cwd,
            contents: fs.readFileSync(path.join(cwd, file))
        };
        storage.push(item);
    });
    console.log('文件读取结束');

    spriteFileConfig.forEach((item) => {

        let translateArray = [];

        storage.forEach((file) => {
            translateArray.push(translateRetina(file.contents, item.ratio));
        });

        console.log(item.fileName + '配置结束!');

        Promise.all(translateArray)
            .then((result) => {

                console.log(item.fileName + '尺寸转换结束');

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

                console.log(item.fileName + '雪碧图配置结束');

                return compileConfig;

            })
            .then((config) => {
                compile(config)
                    .then((result) => {
                        console.log(item.fileName + '编译结束');
                        build(result.buffer, result.dir, result.config);
                    })
                    .catch((error) => {
                        console.log('出错了');
                        console.log(error);
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

            console.log(config.fileName + '转换xml完成');

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

            console.log(config.fileName + '雪碧图配置文件编辑完成');

            mkdirp.sync(dir);

            let pngPath = path.resolve(targetDirPath + '/' + config.fileName + '.png');
            let jsonPath = path.resolve(targetDirPath + '/' + config.fileName + '.json');

            // let pngBuffer = svgToPng.sync(buffer);

            // console.log(config.fileName + 'png buffer 转换完成');

            // fs.writeFile(pngPath, pngBuffer, function () {
            //     console.log(`${config.fileName}.png is already written`);
            // });

            let jsonBuffer = JSON.stringify(outputResult);

            console.log(config.fileName + 'json buffer 转换完成');

            fs.writeFile(jsonPath, jsonBuffer, function () {
                console.log(`${config.fileName}.json is already written`);
            });

            resolve();

        });
    });

}