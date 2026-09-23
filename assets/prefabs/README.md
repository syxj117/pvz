# prefabs/ —— 编辑器拖拽用预制体目录

> **规范红线**：本目录与 `assets/resources/prefabs/` 必须保持同名镜像。
> 见 [docs/TECH_SPEC.md §17](../../docs/TECH_SPEC.md)。

## 子目录约定

```
prefabs/
├── plants/      # 植物：Sunflower.prefab / Peashooter.prefab ...
├── zombies/     # 僵尸：NormalZombie.prefab ...
├── bullets/    # 子弹：Pea.prefab / SnowPea.prefab
├── effects/     # 特效：Sun.prefab / Explosion.prefab
└── ui/          # UI：PlantCard.prefab
```

## 命名规则

- 文件名必须与 `PrefabPath` 常量值末尾段一致（如 `PrefabPath.SUNFLOWER = 'prefabs/plants/Sunflower'` → 文件名 `Sunflower.prefab`）。
- 新增/重命名/删除预制体时必须同步：
  1. `assets/prefabs/<category>/<Name>.prefab`
  2. `assets/resources/prefabs/<category>/<Name>.prefab`
  3. `assets/scripts/core/Constants.ts → PrefabPath`
  4. `assets/scripts/core/Constants.ts → PrefabPathMap`（若是按枚举取用的）

本文件为目录占位，无其他用途，请勿删除。
