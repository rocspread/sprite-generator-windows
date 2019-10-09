#! node

const path = require('path');
const SpriteGenerator = require('../src/sprite-generator');

const argv = process.argv;
const params = argv.filter((arg, index) => {
    return index > 1;
});

if (params.length < 2) {
    console.log(`
        缺少必要参数,请详细阅读文档.
    `);
    return;
}

const sourceDir = path.resolve(params[0]);
const targetDir = path.resolve(params[1]);

SpriteGenerator(sourceDir, targetDir);