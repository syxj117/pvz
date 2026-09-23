# pvz

植物大战僵尸(PVZ)Cocos Creator 3.8.5 移动端复刻项目。

## 快速开始

1. 安装 [Cocos Creator 3.8.5 LTS](https://www.cocos.com/creator-download)
2. 用 Cocos 编辑器打开本项目(首次打开会自动生成 `assets/` 下资源的 `.meta` 文件)
3. 提交生成的 `.meta` 文件入库(见 [TECH_SPEC §13.2](docs/TECH_SPEC.md))

## 开发规范

完整技术规范见 [docs/TECH_SPEC.md](docs/TECH_SPEC.md)(22 章红线)。

提交前请运行本地校验:

```bash
node tools/check_assets.js
```

六类自动校验:.meta 配对、双目录镜像、对象池合规、update 禁令、事件字面量、LFS 合规。任一项不通过即 `exit(1)`。

## 项目结构

```
assets/
  scripts/        TypeScript 业务代码
  prefabs/        预制体源(编辑器拖引用)
  resources/prefabs/  预制体(resources.load 运行时加载)
docs/             技术规范(TECH_SPEC.md)
tools/            校验脚本(check_assets.js)
settings/         Cocos 项目设置
```
