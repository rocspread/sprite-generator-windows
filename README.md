# sprite-generator-windows

### 简介

根据.svg文件构建应用于mapboxgl的雪碧图(适用于windows平台).

### 注意事项

> * .svg图标名称只能包含字母,数字,下划线,中划线

### 安装

```
npm install sprite-generator-windows -g
```

### 使用

```
sprite-generator-windows { 配置文件 }
```

### 配置文件

| 配置名称 | 必填项 | 默认值 | 配置说明                    |
| :------- | :----: | :----: | :-------------------------- |
| source   |   是   |   -    | 存放.svg文件的目录          |
| target   |   是   |   -    | 存放雪碧图构建结果的目录    |
| ratios   |   否   | [1, 2] | 雪碧图构建的比率            |
| sdfs     |   否   |  [ ]   | 需要标记为sdf图标的名称列表 |

### 示例

```
# 1. 准备工作, 参考以下目录结构

|-E:
| |-sprite
|   |-source
|     | bank.svg
|     | car.svg
|     | user.svg
|   |-target
|   | config.json

# 2. 配置素材, 将准备好的素材放入`source`文件夹中

# 3. 配置config.json文件, 参考以下文件

{
    "source": "./source",
    "target": "./target",
    "ratios": [1, 2],
    "sdfs": [
        "bank",
        "car"
    ]
}

当前配置`bank`,`car`将被标记为sdf图标,`user`不会被标记

# 4. 在命令行工具中进入`E:\sprite`目录, 运行`sprite-generator-windows ./config.json`构建雪碧图

# 5. 进入`E:\sprite\target`目录查看构建的雪碧图
```