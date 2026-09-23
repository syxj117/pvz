# resources/prefabs/ —— 运行时 resources.load 用预制体目录

> **规范红线**：本目录与 `assets/prefabs/` 必须保持同名镜像，文件名完全一致。
> 见 [docs/TECH_SPEC.md §17](../../../docs/TECH_SPEC.md)。

## 用途

本目录下的预制体才会被 `resources.load(...)` 加载到。
`assets/prefabs/` 下的预制体只能由编辑器拖入 `@property` 槽使用，**运行时无法被 `resources.load` 加载**。

## 子目录约定（与 prefabs/ 完全一致）

```
resources/prefabs/
├── plants/      # Sunflower.prefab ...
├── zombies/     # NormalZombie.prefab ...
├── bullets/     # Pea.prefab ...
├── effects/     # Sun.prefab / Explosion.prefab
└── ui/          # PlantCard.prefab
```

## 调用方式

```ts
import { PrefabPath } from '../core/Constants';
import { Prefab } from 'cc';

resources.load(PrefabPath.SUNFLOWER, Prefab, (err, prefab) => { ... });
```

**禁止**：在代码中写 `'prefabs/plants/Sunflower'` 字面量字符串作为路径。
**必须**：从 `PrefabPath` 取或通过 `PrefabPathMap[<枚举>]` 取。

本文件为目录占位，无其他用途，请勿删除。
