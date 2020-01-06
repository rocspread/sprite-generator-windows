#! node

const path = require('path');
const fs = require('fs');

const RATIOS = require('../src/configs/ratios');

const SpriteGenerator = require('../src/sprite-generator');

const argv = process.argv;
const params = argv.filter((arg, index) => {
    return index > 1;
});

if (params.length < 1) {
    console.log(`
        请指定配置文件地址...
    `);
    return;
}

// 配置文件地址
const configDir = path.resolve(params[0]);

// 读取配置文件
const configString = fs.readFileSync(configDir, {
    encoding: 'utf8'
});
const config = JSON.parse(configString);

// 资源目录
if (!config.source) {
    console.log(`
        请配置资源目录...
    `);
    return;
}
const sourceDir = path.resolve(config.source);

// 目标目录
if (!config.target) {
    console.log(`
        请配置目标目录...
    `);
    return;
}
const targetDir = path.resolve(config.target);

// sdfs
const sdfs = config.sdfs || [];

// ratios
const ratios = config.ratios || RATIOS;

// 构建雪碧图
SpriteGenerator(sourceDir, targetDir, {
    sdfs, ratios
});