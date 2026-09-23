# 植物大战僵尸 - 技术规范文档（TECH_SPEC）

> 版本：v1.0  ·  生效日期：2026-09-23  ·  作用域：全体开发成员
> 本文档为「硬约束」，与之冲突的实现一律以本文为准。变更需走 §13 变更流程。

---

## 0. 文档目的

把"用什么、怎么用、不能怎么用"一次性钉死，避免后期因选型反复、目录漂移、命名混乱、横竖屏切换导致的整体返工。
**核心原则：先定标准，再写代码；任何与本文冲突的代码不得合入 main 分支。**

---

## 1. 引擎与技术路线锁定

| 项 | 锁定值 | 说明 / 不可变更理由 |
|---|---|---|
| 引擎 | **Cocos Creator 3.8.5 LTS** | LTS 版本稳定、长期维护；不得升/降到其他大版本 |
| 渲染管线 | 内置 forward render pipeline | 2D + 简单 3D 精灵，不上自定义管线 |
| 引擎模块 | `2d`、`ui`、`physics-2d-box2d`、`tween`、`dragon-bones`（可选） | 见 [project.json](file:///workspace/settings/v2/packages/project.json) |
| 脚本语言 | **TypeScript**（`experimentalDecorators` 开启） | 严禁新增 JS 文件 |
| 物理系统 | Box2D（2D） | 仅用于子弹/僵尸/植物的碰撞触发，不做物理模拟 |
| 动画方案 | ① Cocos 内置 Animation/Skeletal ② DragonBones（龙骨） | 优先内置；骨骼动画走 DragonBones |
| UI 框架 | Cocos UI（Label/Sprite/Button/Layout） | 不引入第三方 UI 框架 |
| 状态管理 | 单例 Manager + 事件中心（已实现） | 不引入 Redux/MobX 类外部方案 |
| 资源加载 | `resources.load` + 对象池（已实现） | 配置类资源走 `JsonAsset`，运行时按需加载 |
| 持久化 | `sys.localStorage`（键值前缀 `pvz:`） | 关卡进度/设置；不引入 SQLite |
| 多语言 | 自研 key→string 字典（`assets/resources/i18n/{zh,en}.json`） | 暂只 zh，预留 en |
| 包管理 | 不使用 npm 业务依赖 | 引擎内置能力满足；如确需，走 PR 评审 |
| 版本控制 | Git + Git LFS | 美术/音频二进制走 LFS |

**禁用清单**：不得使用 `eval`、不得用 `as any` 访问私有字段、不得跨场景 `find` 节点、不得在 `update` 中 `instantiate`/`resources.load`/`find`/`console.log`（详见 §20 红线）。

---

## 2. 横屏锁定（强制）

**结论：仅横屏，不提供竖屏。** 横屏对 PVZ 草坪（5 行 × 9 列）还原度更高，竖屏会导致格子被压扁、HUD 拥挤。

### 2.1 设计分辨率

| 项 | 值 |
|---|---|
| 设计分辨率 | **1280 × 720**（横屏 16:9） |
| 适配模式 | `fitHeight = true`，`fitWidth = false` |
| Canvas 锚点 | (0.5, 0.5) |
| 安全区 | 1280 × 720（核心 UI 元素不得超出此区） |
| 边缘留白 | 左右各预留 40px、上下各 20px 作为非核心元素缓冲 |

> 已在 [project.json](file:///workspace/settings/v2/packages/project.json) 锁定：`fitHeight:true, fitWidth:false`。

### 2.2 各端横屏方向

| 端 | 横屏方向 | 设置位置 |
|---|---|---|
| Android | `landscapeLeft + landscapeRight`（都允许，跟随重力） | [builder.json](file:///workspace/settings/v2/packages/builder.json) |
| 预览/编辑器 | landscape | [project.json](file:///workspace/settings/v2/packages/project.json) `preview.orientation` |
| iOS（后续） | 同 Android | 后续补 |

### 2.3 适配验证规则

- 草坪 5 行总高度 = 5 × 100 = 500px，居中后 y 范围 [−250, 250]，留 110px 给上下 HUD，**禁止改 GRID.CELL_HEIGHT**。
- 卡牌栏默认在顶部，宽度 ≤ 540px（6 张卡 × 90px）；超出走横向滚动。
- 阳光数显示固定左上角 (−600, 340)。
- 凡是固定坐标的 UI，**必须用相对 Canvas 中心的本地坐标**，禁止用屏幕坐标硬编码。

---

## 3. 目录结构规范（已落地，禁止漂移）

```
/workspace
├── assets/
│   ├── scenes/                  # *.scene 场景文件
│   ├── scripts/                 # 所有 TS 代码
│   │   ├── core/                # 框架层：Constants/EventCenter/Pool/GameManager
│   │   ├── managers/            # 业务管理器：Level/Sun/Wave/UI
│   │   ├── plant/               # 植物系统：PlantBase + 具体植物
│   │   ├── zombie/              # 僵尸系统：ZombieBase + 具体僵尸
│   │   ├── bullet/              # 子弹系统
│   │   ├── grid/                # 草坪网格 + 阳光掉落
│   │   ├── config/              # 静态配置表（Plant/Zombie/Level）
│   │   ├── ui/                  # UI 组件（HUD/Card/PlantPlacer）
│   │   ├── systems/             # 跨模块系统层（碰撞/结算，预留）
│   │   ├── utils/               # 工具函数（数学/时间，预留）
│   │   └── GameStart.ts         # 场景启动入口
│   ├── prefabs/                 # 预制体（按类别分子目录）
│   │   ├── plants/              #   Sunflower.prefab …
│   │   ├── zombies/             #   NormalZombie.prefab …
│   │   ├── bullets/             #   Pea.prefab …
│   │   ├── ui/                  #   PlantCard.prefab …
│   │   └── effects/             #   爆炸/掉血特效
│   ├── resources/               # 运行时动态加载的资源（路径即 key）
│   │   ├── prefabs/             #   与 prefabs/ 同结构镜像（resources.load 用）
│   │   ├── configs/             #   *.json 配置（后续热更）
│   │   ├── i18n/                #   zh.json / en.json
│   │   └── audio/               #   *.mp3/*.ogg（按需加载）
│   ├── images/                  # 静态贴图（自动图集）
│   │   ├── plants/  zombies/  ui/  lawn/  effects/
│   ├── audio/                   # 静态音频（背景音/常驻 SFX）
│   │   ├── bgm/  sfx/
│   └── animations/             # DragonBones / AnimationClip
├── settings/v2/packages/        # 引擎项目设置
├── build/                       # 构建产物（git ignore）
└── docs/                        # 文档（本目录）
```

**强制规则**：
- 新增脚本必须落到上述对应子目录，禁止堆在 `scripts/` 根下。
- `resources/` 与 `prefabs/` 是两套：前者用于运行时 `resources.load`，后者用于编辑器拖拽。运行时按 key 取的预制体（植物/僵尸/子弹/阳光）**必须同时存在于 `resources/prefabs/...`**。
- 同名文件不得跨目录重复（避免 meta 冲突）。

---

## 4. 命名规范

### 4.1 文件 / 类

| 类型 | 规则 | 示例 |
|---|---|---|
| TS 文件 | PascalCase，与默认导出类同名 | `Sunflower.ts` |
| 类名 | PascalCase | `class Peashooter` |
| 脚本组件名（`@ccclass`） | 与类名一致 | `@ccclass('Peashooter')` |
| 预制体 | PascalCase | `Sunflower.prefab` |
| 场景 | PascalCase | `Game.scene` |
| 图片纹理 | snake_case | `pea_bullet.png` |
| 音频 | snake_case + 前缀 | `sfx_pea_shoot.mp3`、`bgm_main.mp3` |
| 配置 JSON | snake_case | `level_1_1.json` |

### 4.2 代码标识符

| 类型 | 规则 | 示例 |
|---|---|---|
| 变量/函数 | camelCase | `takeDamage()`、`sunCount` |
| 私有字段 | `_camelCase` | `_hp`、`_isDead` |
| 常量 | UPPER_SNAKE_CASE | `GRID.ROWS`、`SUN.INIT_VALUE` |
| 枚举值 | PascalCase（字符串字面量） | `PlantType.SUNFLOWER = 'Sunflower'` |
| 接口/类型 | PascalCase，前缀不加 I | `PlantConfig`、`WaveData` |
| 事件名 | kebab-case 字符串 | `'sun-change'`、`'plant-placed'` |

### 4.3 节点命名（场景/预制体内）

- 节点名用 PascalCase，禁止 `Node`、`Sprite`、`New Node` 等默认名。
- 节点名需体现职责：`SunLabel`、`CardBar`、`WaveTipLabel`。
- 同类多个节点加数字后缀：`CardSlot1`、`CardSlot2`…

---

## 5. 代码规范

### 5.1 强制规则

1. **单例**：仅 `GameManager` 与全局 `eventCenter`/`poolManager` 可作为单例；其他 Manager 必须由 `GameManager` 持有引用，不得自造全局。
2. **事件**：跨模块通信一律走 [EventCenter](file:///workspace/assets/scripts/core/EventCenter.ts)。事件名集中定义在 [Constants.ts → GameEvents](file:///workspace/assets/scripts/core/Constants.ts)，禁止散落字符串字面量。详见 §21（红线）。
3. **对象池**：所有可复用节点（植物/僵尸/子弹/阳光/特效）必须经 [poolManager](file:///workspace/assets/scripts/core/Pool.ts) 取/还，禁止裸 `instantiate` 后 `destroy`。详细红线规则见 §18。
4. **预制体加载**：运行时取预制体优先 `poolManager.get(key)`；池空时回退 `resources.load('prefabs/<category>/<Name>', Prefab, cb)`，路径常量集中在 `Constants.ts`。
5. **update 内禁止**：`instantiate`、`resources.load`、`find`、`console.log`、复杂数学分配。详见 §20（红线）。
6. **生命周期解绑**：`onLoad` 里 `on` 的事件，`onDestroy` 必须配对 `off`；用第三参 `target=this` 以便批量解绑。
7. **类型**：函数入参/返回值标注类型；禁用 `any`，必须用时写 `unknown` + 类型守卫。
8. **装饰器**：`@property` 必须显式声明类型，数组用 `@property([Node])`。

### 5.2 推荐规则

- 单文件 ≤ 400 行，超出考虑拆分。
- 单函数 ≤ 60 行，圈复杂度 ≤ 10。
- 公共 API 写 JSDoc 注释（中文）。
- 魔法数字必须走 `Constants.ts` 或对应 `Config`。

### 5.3 注释

- 文件头：`/** 模块名 + 职责一句话 + 用法 */`。
- 复杂逻辑段：行内 `//` 注释意图，不注释"做什么"。
- 已知 TODO：`// TODO(name): 描述 + #issue号`。

---

## 6. 资源规范（美术 / 音频）

### 6.1 美术

| 项 | 规范 |
|---|---|
| 格式 | 静态精灵 `.png`（含透明通道）；UI 图集 `.png` + 自动合图 |
| 草坪格子基准 | 90 × 100 px（与 `GRID.CELL_WIDTH/HEIGHT` 一致） |
| 植物立绘 | ≤ 96 × 110 px（不超过格子） |
| 僵尸立绘 | ≤ 80 × 120 px（可略高于格子） |
| UI 图标 | 64 × 64 / 90 × 90（卡牌用 90×90） |
| 颜色空间 | sRGB，PMA 由引擎处理 |
| 最大单图 | ≤ 1024 × 1024；超过需切分 |
| 命名 | 见 §4.1；植物/僵尸加类型前缀：`plant_sunflower_idle.png` |

### 6.2 动画

- 帧动画：序列帧放在 `animations/{plant|zombie}/{Name}/`，命名 `{Name}_{action}_{frame}.png`。
- 骨骼动画：DragonBones，导出 `.dbbin` + `_ske.json` + `_tex.json` + `_tex.png`，放在 `animations/dragonbones/{Name}/`。
- 动画事件（如攻击命中、阳光生成）通过 `AnimationComponent` 的 `onAnimationPlayed` 或事件帧触发，不写在 `update` 里轮询。

### 6.3 音频

| 项 | 规范 |
|---|---|
| BGM | `.mp3`，码率 ≤ 128kbps，长度循环点对齐 |
| SFX | `.mp3` 或 `.ogg`，码率 ≤ 96kbps，单条 ≤ 3s |
| 采样率 | 44100 Hz |
| 命名 | `bgm_<场景>.mp3`、`sfx_<对象>_<动作>.mp3`（如 `sfx_pea_shoot.mp3`） |
| 加载 | BGM 静态加载；SFX 走 `resources.load` + 单例 `AudioManager`（待实现） |

### 6.4 资源体积红线

- 整包未压缩 ≤ 80 MB（Google Play 单 APK 推荐上限）。
- 单图 ≤ 500 KB，单音频 ≤ 300 KB。
- 超限走 `Asset Bundle` 拆分（首包仅放 1-1 关资源，其他关卡分包下载）。

---

## 7. 性能规范

| 指标 | 目标值 | 验证手段 |
|---|---|---|
| 帧率 | 中端机型稳定 60 FPS，低端 30 FPS | 引擎 Profiler + 真机 |
| 单帧脚本耗时 | ≤ 8 ms（60FPS） | Profiler |
| Draw Call | ≤ 120 | 自动合图 + 合批 |
| 内存峰值 | ≤ 350 MB（含图集/音频） | 真机内存监视 |
| GC 频率 | 战斗中 ≤ 1 次/分钟 | 严格走对象池 |
| 包体 | APK ≤ 80 MB | 构建产物 |

**强制约束**：
- 所有可复用 Prefab 必须注册到对象池；`die()/recycle()` 必须归还而非 `destroy()`。
- 图集：`images/<category>/` 下用引擎自动合图（Auto Atlas），每类一个图集，禁止跨类混入。
- 频繁更新 UI（如阳光数）只更新变化的字段，不整页刷新。

---

## 8. 模块设计规范（已落地框架的扩展规则）

### 8.1 新增植物流程（标准模板）

1. 在 `Constants.ts → PlantType` 加枚举值。
2. 在 [PlantConfig.ts](file:///workspace/assets/scripts/config/PlantConfig.ts) 加配置条目（cost/hp/actionInterval/cooldown/icon）。
3. 在 `assets/scripts/plant/` 新建 `<Name>.ts` 继承 [PlantBase](file:///workspace/assets/scripts/plant/PlantBase.ts)，覆写 `onAction()`。
4. **同步制作两份预制体**（见 §17）：`assets/prefabs/plants/<Name>.prefab` + `assets/resources/prefabs/plants/<Name>.prefab`，并挂上脚本。
5. 在 [Constants.ts](file:///workspace/assets/scripts/core/Constants.ts) 的 `PrefabPath` 与 `PrefabPathMap` 各补一行路径常量。
6. 在 [GameStart.ts](file:///workspace/assets/scripts/GameStart.ts) 加 `@property` 槽 + `registerPrefabs()` 注册（编辑器拖拽槽用 `prefabs/` 下预制体）。
7. 卡牌栏 UI 加对应卡牌节点（挂 [PlantCard](file:///workspace/assets/scripts/ui/PlantCard.ts)）。

### 8.2 新增僵尸流程

1. `Constants.ts → ZombieType` 加枚举。
2. [ZombieConfig.ts](file:///workspace/assets/scripts/config/ZombieConfig.ts) 加条目（**不含 prefabPath 字段**，路径统一走 `PrefabPathMap`）。
3. `scripts/zombie/<Name>.ts` 继承 [ZombieBase](file:///workspace/assets/scripts/zombie/ZombieBase.ts)，按需覆写 `takeDamage/enterRage`。
4. **同步制作两份预制体**：`assets/prefabs/zombies/<Name>.prefab` + `assets/resources/prefabs/zombies/<Name>.prefab`，挂上脚本。
5. 在 [Constants.ts](file:///workspace/assets/scripts/core/Constants.ts) 的 `PrefabPath` + `PrefabPathMap` 补路径常量。
6. `GameStart.ts` 注册。

### 8.3 新增关卡流程

1. [LevelConfig.ts](file:///workspace/assets/scripts/config/LevelConfig.ts) 的 `LEVEL_CONFIGS` 数组追加 `LevelConfig`。
2. `availablePlants` 决定本关可选植物；超出当前关解锁进度不可加入。
3. `waves` 顺序即推进顺序；最后一波 `isFinal: true` 触发结算。

### 8.4 跨模块系统层（预留）

- 凡是涉及多实体协同的逻辑（如子弹↔僵尸碰撞检测、僵尸啃植物、范围伤害结算）放在 `scripts/systems/` 下作为独立 System 组件，挂到场景 `EntityManager` 节点。
- System 不持有数据，只读取 Manager/实体状态并调用其方法。

---

## 9. UI 规范

### 9.1 HUD 布局（1280 × 720）

```
┌────────────────────────────────────────────────────────┐
│ ☀ 50    [向日葵][豌豆][坚果]...            ⏸ 暂停      │  顶栏 y≈340
├────────────────────────────────────────────────────────┤
│                                                        │
│            草坪 5 × 9 格（y: 220 → -280）              │
│                                                        │
├────────────────────────────────────────────────────────┤
│ 铲子  进度条 ▓▓▓▓▓▓░░░░  下一波提示                   │  底栏 y≈-330
└────────────────────────────────────────────────────────┘
```

- 顶栏高度 80px，底栏高度 60px，草坪净高 580px。
- 弹窗（暂停/胜负）使用全屏遮罩 + 居中卡片，遮罩 `opacity=180`。

### 9.2 交互

- 玩家点击卡牌 → 进入"待种植"态（卡牌高亮 + 跟随手指的半透明植物预览）。
- 点击空格放置；点击非空格或阳光不足抖动反馈。
- 长按卡牌 0.5s 弹出该植物说明气泡（后续）。
- 暂停时全场 `director.pause()`，但 UI 层不受影响。

### 9.3 字体

- 中文字体：默认系统字体（思源黑体后续可换）；不内嵌字体文件（控包体）。
- 数字（阳光数）用等宽数字字体。

---

## 10. 数据与配置规范

- **静态配置**：植物/僵尸/关卡属性目前在 TS 常量中（[config/](file:///workspace/assets/scripts/config)），首版可直接进包；后续改为 `resources/configs/*.json` 热更时，TS 改为只读接口，逻辑层无感。
- **存档**：`sys.localStorage`，键格式 `pvz:<scope>:<key>`，例如 `pvz:progress:level`、`pvz:settings:audio`。
- **存档结构**：JSON 对象，加 `version` 字段，便于后续迁移。
- **严禁**把存档/配置硬编码进脚本逻辑分支。

---

## 11. 国际化（i18n）

- 文案集中在 `resources/i18n/{zh,en}.json`，key 用点分层：`"ui.hud.pause"`。
- 代码中所有可见文案经 `I18n.t('ui.hud.pause')` 取（`I18n` 待实现，签名见下）。
- 首版只产出 zh；en 结构需先建好留空。

```ts
// 待实现签名（仅约束接口）
interface I18n { static t(key: string, params?: Record<string, any>): string; }
```

---

## 12. 构建发布规范（Android APK）

### 12.1 构建配置（已落地）

见 [builder.json](file:///workspace/settings/v2/packages/builder.json)：

| 项 | 值 |
|---|---|
| 平台 | Android |
| 包名 | `com.pvz.cocos` |
| 方向 | landscapeLeft + landscapeRight |
| ABI | `arm64-v8a`、`armeabi-v7a` |
| minSdk / targetSdk | 21 / 30（API Level 30） |
| 输出名 | `PVZ` |
| 产物路径 | `build/android/proj/.../PVZ.apk` |
| 签名 | 开发期用 debug keystore；发布期改正式 keystore（密钥不入库） |

### 12.2 环境要求

- Cocos Creator 3.8.5
- Android NDK r23+、Android SDK API 30+、JDK 17
- 在「偏好设置 → 原生开发环境」配置上述路径。

### 12.3 发布流程

1. 引擎内构建 → 生成 Android 工程。
2. 命令行 `./gradlew assembleRelease` 产出 APK（含正式签名）。
3. 真机自测（见 §14 验收清单）。
4. 上架 Google Play 走 AAB（后续开关 `aab:true`）。

### 12.4 包体瘦身

- 启用引擎「压缩纹理」：ASTC 6×6（Android 主流）。
- 不打包未使用的引擎模块（如 3D 物理 terrain）。
- 美术资源合图 + 音频降码率（见 §6）。

---

## 13. 版本控制与协作

### 13.1 分支

| 分支 | 用途 |
|---|---|
| `main` | 可发布稳定版；只接受 PR 合入，需 1 人 review |
| `dev` | 集成测试分支 |
| `feat/<模块>-<描述>` | 功能开发 |
| `fix/<issue号>-<描述>` | 缺陷修复 |

### 13.2 .gitignore 与 .meta 红线

**忽略清单**（不入库）：
`/library/`、`/temp/`、`/local/`、`/build/`、`/profiles/`、`/native/`、`/clang-debug/`、`/conan/`、`.DS_Store`、`.vscode/`、`.idea/`、`*.log`、`*.tmp`、`*.swp`、`*~`

**.meta 红线（强制）**：
1. `.meta` 文件**必须入库**，是 Cocos 资源引用的根（GUID 写在 .meta 内，缺失会导致编辑器引用全部断裂）。
2. `.gitignore` 中**禁止**出现任何忽略 `*.meta` 的规则，禁止任何人手动添加。
3. `.meta` 与其宿主资源**成对提交**：提交 `.ts/.prefab/.scene/.png/.mp3/...` 时必须连同对应 `.meta` 一起提交，反之亦然。
4. 禁止删除既有 `.meta`（即便对应资源已废弃，删除前应连同资源一起移除并在 PR 说明）。

**Git LFS**：所有二进制资源走 LFS，详见 §22（红线）。

### 13.3 Commit 规范

`<type>(<scope>): <subject>`，type ∈ `feat/fix/docs/refactor/perf/chore/test`。

例：`feat(plant): 新增寒冰射手及冰冻减速逻辑`。

### 13.4 文档变更流程

本规范文档变更需：
1. 提 PR，标题 `docs(spec): <变更说明>`。
2. 至少 1 名核心成员 review。
3. 合入即生效，旧实现按本规范迁移，迁移工作记入 issue。

---

## 14. 真机验收清单（Android）

发布前必须全过：

- [ ] 横屏方向跟随重力切换不闪退。
- [ ] 1280×720 在 18:9 / 20:9 / 21:9 异形屏不裁剪核心 UI。
- [ ] 单关 5 分钟无闪退、无内存泄漏（内存涨幅 ≤ 30MB）。
- [ ] 帧率：中端机稳定 60FPS，低端机 ≥ 30FPS。
- [ ] 触摸：卡牌点击、网格放置、阳光拾取在 60Hz/120Hz 屏均正常。
- [ ] 后台 → 前台：BGM 不重叠、游戏状态正确恢复（暂停态）。
- [ ] 音频中断（来电）后能恢复。
- [ ] APK 体积 ≤ 80MB。
- [ ] 退出后存档（关卡进度/设置）正确保留。

---

## 15. 风险与回滚

| 风险 | 触发 | 缓解 |
|---|---|---|
| 横竖屏反复 | 产品临时加竖屏 | 本规范锁定横屏，需求变更走 §13 |
| 引擎升级 | 3.8 → 4.x | 评估期内禁止合入 main |
| 对象池泄漏 | `get` 多 `put` 少 / 裸 `destroy()` | §18 红线 + PR 配对检查 + 后续 CI 校验 |
| `resources` 路径漂移 | 重命名未同步常量 | §17 强制走 PrefabPath 常量 + CI 路径检查 |
| `.meta` 缺失/漏提/误删 | 手动删库或漏提交 | §13.2 红线 + PR 配对检查 + 后续 CI 校验 |
| **双目录失同步** | 只在 prefabs/ 改了不同步 resources/prefabs/ | §17 红线 + PR 检查清单 |
| **update 内重活** | 在 update 里 instantiate/load/find/log | §20 红线 + CI 规则4 自动校验 |
| **事件名散落** | eventCenter 调用直接写字符串字面量 | §21 红线 + CI 规则5 自动校验 |
| **二进制未入 LFS** | 二进制资源以普通 blob 直提交 | §22 红线 + CI 规则6 自动校验 |

---

## 16. 待实现模块（优先级排序）

| 优先级 | 模块 | 备注 |
|---|---|---|
| P0 | 碰撞系统 `BulletSystem` / `ZombieEatSystem` | 子弹↔僵尸、僵尸↔植物 |
| P0 | `AudioManager` | BGM/SFX 集中调度 |
| P0 | 美术/音频占位资源 | 让框架能跑通 |
| P1 | `I18n` | 文案集中 |
| P1 | 存档 `SaveManager` | 关卡进度 |
| P1 | 关卡选择 UI | 多关卡入口 |
| P2 | 商店/卡牌解锁 | 经济系统 |
| P2 | AAB + 分包 | Google Play 上架 |

---

## 17. 双目录同步红线（资源生命周期硬约束）

> 本条为**红线**，违反即视为阻断合并的硬伤。所有预制体（Prefab）资源必须遵守。

### 17.1 双目录定义

| 目录 | 用途 | 加载方式 |
|---|---|---|
| `assets/prefabs/<category>/<Name>.prefab` | 编辑器内 `@property` 拖拽用 | 编辑器引用（GUID） |
| `assets/resources/prefabs/<category>/<Name>.prefab` | 运行时 `resources.load(...)` 用 | 按路径字符串加载 |

> **关键认知**：Cocos Creator 中，只有放在 `assets/resources/` 下的资源才能被 `resources.load(path, ...)` 在运行时按路径加载。`assets/prefabs/` 下的资源**无法**被 `resources.load` 加载到。两者不可互相替代。

### 17.2 同步规则（强制）

1. **同名镜像**：`prefabs/<category>/<Name>.prefab` 与 `resources/prefabs/<category>/<Name>.prefab` 文件名、目录层级必须完全一致。
2. **同 GUID 同内容**：两份预制体内引用的脚本、贴图、动画必须完全一致；推荐从 `prefabs/` 复制到 `resources/prefabs/` 后保留为副本（编辑器会生成新 GUID，不影响运行时按路径加载）。
3. **四点同步变更清单**：任何预制体的新增/重命名/删除，必须**同步执行以下四步**，缺一不可：
   - ① 修改 `assets/prefabs/<category>/<Name>.prefab`
   - ② 修改 `assets/resources/prefabs/<category>/<Name>.prefab`
   - ③ 在 [Constants.ts → PrefabPath](file:///workspace/assets/scripts/core/Constants.ts) 补/改对应路径常量
   - ④ 如该类型通过枚举取用，在 [Constants.ts → PrefabPathMap](file:///workspace/assets/scripts/core/Constants.ts) 补/改对应映射项
4. **路径常量唯一来源**：运行时取预制体路径必须从 `PrefabPath` 或 `PrefabPathMap` 取，**严禁**在业务代码中写 `'prefabs/plants/Sunflower'` 字面量或模板字符串拼路径。
5. **对象池 key 统一来源**：非枚举类实体（阳光/特效/UI 卡）的对象池 key 必须从 [Constants.ts → PoolKey](file:///workspace/assets/scripts/core/Constants.ts) 取；枚举类（PlantType/ZombieType/BulletType）的枚举值即为 key。
6. **配置表不得内嵌路径**：[PlantConfig](file:///workspace/assets/scripts/config/PlantConfig.ts) / [ZombieConfig](file:///workspace/assets/scripts/config/ZombieConfig.ts) 中**不写** `prefabPath` 字段；路径查询一律在调用点走 `PrefabPathMap[<type>]`。

### 17.3 已落地目录镜像（v1.0）

```
assets/prefabs/                  assets/resources/prefabs/
├── plants/                      ├── plants/
│   ├── Sunflower.prefab         │   ├── Sunflower.prefab
│   ├── Peashooter.prefab        │   ├── Peashooter.prefab
│   ├── Wallnut.prefab           │   ├── Wallnut.prefab
│   ├── CherryBomb.prefab        │   ├── CherryBomb.prefab
│   ├── SnowPea.prefab           │   ├── SnowPea.prefab
│   └── Repeater.prefab          │   └── Repeater.prefab
├── zombies/                     ├── zombies/
│   ├── NormalZombie.prefab      │   ├── NormalZombie.prefab
│   ├── ConeZombie.prefab        │   ├── ConeZombie.prefab
│   ├── BucketZombie.prefab      │   ├── BucketZombie.prefab
│   └── NewspaperZombie.prefab   │   └── NewspaperZombie.prefab
├── bullets/                     ├── bullets/
│   ├── Pea.prefab               │   ├── Pea.prefab
│   └── SnowPea.prefab           │   └── SnowPea.prefab
├── effects/                     ├── effects/
│   ├── Sun.prefab               │   ├── Sun.prefab
│   └── Explosion.prefab         │   └── Explosion.prefab
└── ui/                          └── ui/
    └── PlantCard.prefab             └── PlantCard.prefab
```

> 当前两侧目录均仅有占位 `README.md`，待美术/预制体制作时按上表逐个补齐。

### 17.4 PR 检查清单（审阅者必看）

提交涉及预制体的 PR 时，审阅者必须逐项核对：

- [ ] 是否同时修改了 `prefabs/` 与 `resources/prefabs/` 下的同名文件？
- [ ] 是否同步更新了 `PrefabPath` 常量？
- [ ] 是否同步更新了 `PrefabPathMap`（如属枚举取用）？
- [ ] 业务代码中无新增 `'prefabs/...'` 字面量字符串（grep `prefabs/` 在 `scripts/` 下应只出现在 `Constants.ts`）。
- [ ] 配置表（`PlantConfig`/`ZombieConfig`）无 `prefabPath` 字段。

### 17.5 自动化校验（后续 P1）

待 CI 接入后，将加一个脚本扫描 `assets/prefabs/` 与 `assets/resources/prefabs/`，凡一侧存在而另一侧缺失的 `.prefab` 直接 fail；同时 grep `scripts/` 下 `'prefabs/` 字面量，命中即 fail。

> **已落地**：[tools/check_assets.js](file:///workspace/tools/check_assets.js) 规则2 已实现，本地执行 `node tools/check_assets.js` 即可校验，详见 §19。

---

## 18. 对象池强制回收红线（内存与 GC 硬约束）

> 本条为**红线**，违反即视为阻断合并的硬伤。所有可复用实体必须遵守。
> 违反后果：内存泄漏、GC 频率飙升、帧率抖动，§7 性能指标无法达标。

### 18.1 适用实体清单

下列实体的节点**生命周期归对象池管理**，禁止 `destroy()`：

| 实体 | 基类 | 对象池 key 来源 | 归还方法 |
|---|---|---|---|
| 植物 | [PlantBase](file:///workspace/assets/scripts/plant/PlantBase.ts) | `PlantType.*`（枚举值） | `PlantBase.die()` |
| 僵尸 | [ZombieBase](file:///workspace/assets/scripts/zombie/ZombieBase.ts) | `ZombieType.*`（枚举值） | `ZombieBase.die()` |
| 子弹 | [BulletBase](file:///workspace/assets/scripts/bullet/BulletBase.ts) | `BulletType.*`（枚举值） | `BulletBase.recycle()` |
| 阳光 | SunItem（待实现） | [PoolKey.SUN](file:///workspace/assets/scripts/core/Constants.ts) | `SunItem.recycle()` |
| 特效（爆炸等） | EffectBase（待实现） | [PoolKey.EXPLOSION](file:///workspace/assets/scripts/core/Constants.ts) | `EffectBase.recycle()` |

### 18.2 强制规则

1. **死亡必归还**：实体 HP 归零 / 完成使命（如阳光被拾取、特效播放完毕）时，必须调用本基类提供的 `die()` 或 `recycle()`，**禁止**直接 `this.node.destroy()` / `node.destroy()`。
2. **越界必归还**：实体移出有效区域（子弹飞出屏幕、僵尸抵达房屋）时，必须走 `recycle()`/`die()`，**禁止** `destroy()`。
3. **`get` 与 `put` 必须配对**：每个 `poolManager.get(key)` 取出的节点，其最终归宿必须是 `poolManager.put(key, node)`（或基类封装的 `die/recycle` 内部 put）。`get` 多次 `put` 少一次即为泄漏。
4. **归还前置清理**：归还前必须重置节点状态，避免复用时携带上次的状态：
   - `node.active = false`（先停用，避免归池瞬间仍被 update）
   - 位置/速度/计时器/事件回调重置为初始值
   - 父节点解除（可选，由取出方决定挂载点）
5. **唯一例外**：实体**未注册到对象池**（即 `PrefabPathMap`/`PoolKey` 中无对应 key）时，基类兜底允许 `node.destroy()`。此兜底分支必须在代码注释中显式标注 `// 兜底：未注册到对象池，无池可归`，否则视为违规。

### 18.3 已落地合规情况（v1.0）

| 实体 | 归还路径 | 是否合规 |
|---|---|---|
| 植物 | [PlantBase.die()](file:///workspace/assets/scripts/plant/PlantBase.ts) → `poolManager.put(plantType, node)`；未注册时兜底 destroy 并注释 | ✅ |
| 僵尸 | [ZombieBase.die()](file:///workspace/assets/scripts/zombie/ZombieBase.ts) → `poolManager.put(zombieType, node)`；未注册时兜底 destroy 并注释 | ✅ |
| 子弹 | [BulletBase.recycle()](file:///workspace/assets/scripts/bullet/BulletBase.ts) → `poolManager.put(bulletType, node)`；未注册时兜底 destroy 并注释 | ✅ |
| 阳光 | [SunDropSystem.onTapSun](file:///workspace/assets/scripts/grid/SunDropSystem.ts) → `poolManager.put(PoolKey.SUN, target)` | ✅ |

> 待补：① SunItem/EffectBase 独立组件实现后补归池方法；② 子弹命中目标后调用 `BulletBase.onHit()` 的 `BulletSystem` 待实现（P0）。

### 18.4 PR 检查清单（审阅者必看）

提交涉及实体的 PR 时，审阅者必须逐项核对：

- [ ] 新增/修改的实体类，死亡/越界路径调用的是 `die()`/`recycle()`，而非 `destroy()`？
- [ ] `poolManager.get(key)` 与 `poolManager.put(key, node)` 是否成对？
- [ ] 归还前是否重置节点状态（active/pos/timer/callback）？
- [ ] 若存在 `destroy()` 调用，是否处于"未注册兜底"分支且带 `// 兜底：未注册到对象池` 注释？
- [ ] [Pool.ts](file:///workspace/assets/scripts/core/Pool.ts) 内部的 `node.destroy()` 是对象池自身兜底（无对应池时），不算违规。

### 18.5 自动化校验（后续 P1）

待 CI 接入后，将加一个脚本扫描 `assets/scripts/`：
1. 凡 `\.destroy\(\)` 调用出现在 `PlantBase`/`ZombieBase`/`BulletBase`/`SunItem`/`EffectBase` 及其子类的非兜底分支，直接 fail。
2. 凡实体类的 `die()`/`recycle()` 未调用 `poolManager.put()`，直接 fail。

> **已落地**：[tools/check_assets.js](file:///workspace/tools/check_assets.js) 规则3 已实现（含 `// 兜底` 注释豁免），详见 §19。

---

## 19. 资源校验脚本（tools/check_assets.js）

### 19.1 用途与依赖

- **路径**：[tools/check_assets.js](file:///workspace/tools/check_assets.js)
- **依赖**：仅 Node.js 原生模块（`fs`/`path`），**禁止引入任何第三方依赖**
- **调用方式**：在项目根目录执行 `node tools/check_assets.js`
- **退出码**：全部通过 `0`，任一项失败 `1`

### 19.2 三类校验规则

| 规则 | 内容 | 对应规范 |
|---|---|---|
| 规则1 | `.meta` 配对：assets/ 下白名单后缀资源必须有同名 `.meta`，反之孤儿 `.meta` 也算违规 | §13.2 |
| 规则2 | 双目录镜像：`assets/prefabs/` ↔ `assets/resources/prefabs/` 下 `.prefab` 文件结构必须双向一一对应 | §17 |
| 规则3 | 对象池合规：plant/zombie/bullet 下禁止直接 `destroy()`；`die()`/`recycle()` 必须调 `poolManager.put()` | §18 |

**白名单后缀**（规则1）：`.ts .prefab .scene .png .jpg .jpeg .mp3 .ogg .wav .json .font .dbbin .plist .ttf .otf .anim`

**跳过目录**（任何层级，大小写不敏感）：`library temp build local`

**路径比对**：统一转小写，避免跨平台大小写问题。

### 19.3 兜底豁免（与 §18.2 第5条一致）

规则3 检测到 `.destroy()` 调用时，向上回溯 5 行，若任一行含 `兜底` 字样，视为合规兜底分支，豁免。
原因：§18.2 第5条允许"未注册到对象池"的兜底分支带 `// 兜底：未注册到对象池` 注释调用 `destroy()`，否则基类无法兜底销毁。

### 19.4 输出格式

失败项：`❌ [规则X] <相对路径>[:行号] - <原因>`

汇总：`❌ 共 N 项不通过` 或 `✅ 全部校验通过`

### 19.5 使用时机

1. **本地提交前**：开发者本地跑一遍 `node tools/check_assets.js`，必须 `exit(0)` 才能提交。
2. **PR CI**：PR 检查必跑，非 `exit(0)` 阻断合并。
3. **首次入库前**：项目首次提交时若 `.meta` 尚未生成（Cocos 编辑器未打开过），规则1 会大量失败，属正常预期——编辑器打开项目生成 `.meta` 并入库后再推。

> **更新**：脚本现已包含规则4（update 内禁令）、规则5（事件字面量）与规则6（LFS 合规），详见 §20 / §21 / §22。

---

## 20. update 内禁令红线（性能硬约束）

> 本条为**红线**，违反即视为阻断合并的硬伤。`update()` 是每帧调用的高频入口，必须保持极轻量。

### 20.1 禁止清单

任何继承 `Component` 的类的 `update(dt: number)` 方法体内，**禁止出现**以下调用：

| 禁止项 | 原因 |
|---|---|
| `instantiate(...)` | 触发 GC + 节点树重建，每帧调用会撑爆内存 |
| `resources.load(...)` | 异步加载，update 同步等待会卡帧；应在 `onLoad`/事件回调里预加载 |
| `find(...)` / `findChild(...)` | 全树字符串遍历，O(N) 查找每帧调用积累成抖动；应在 `onLoad` 缓存引用 |
| `console.log(...)` | 安卓真机 JS→原生桥接开销大，每帧打印会拖帧 |

### 20.2 例外

- **`dt` 参数数学运算**：`this._timer += dt` 等基础算术允许，但禁止在 update 内调用 `Math.sin`/`Math.cos` 之外的复杂计算（如每帧 `JSON.parse`、`new RegExp`）。
- **状态查询**：缓存好的引用（如 `this._targetNode.position`）允许访问，前提是引用在 `onLoad`/事件回调里获取。
- **定时器替代**：需要周期性副作用时，用 `this.schedule(callback, interval)` 替代 update 内轮询。

### 20.3 写法准则

```typescript
// ❌ 错误：update 内 instantiate
update(dt: number) {
    if (this._fire) {
        const node = instantiate(this.bulletPrefab); // 禁止！
        this.node.addChild(node);
    }
}

// ✅ 正确：update 只计时，副作用走事件/方法
update(dt: number) {
    this._fireTimer += dt;
    if (this._fireTimer >= this._fireInterval) {
        this._fireTimer = 0;
        this.fire(); // 在 fire() 里 instantiate，且优先 poolManager.get()
    }
}
```

### 20.4 自动化校验

[tools/check_assets.js](file:///workspace/tools/check_assets.js) 规则4 已实现 update 禁令检测：
- 扫描 `assets/scripts/` 下所有 `.ts` 文件
- 找到 `update(dt)` / `update(delta)` 方法体
- 检测方法体内是否含 `instantiate(`/`resources.load(`/`find(`/`console.log` 调用
- 命中即 fail

### 20.5 AI 协作约束

凡 AI 生成涉及 `Component` 子类的代码，**Prompt 中必须包含本条禁令**，生成的代码若违反即视为生成失败。

---

## 21. 事件集中定义红线（可维护性硬约束）

> 本条为**红线**，违反即视为阻断合并的硬伤。事件名散落会让改名漏改、typo 无提示、跨模块对不上号。

### 21.1 定义与位置

- **唯一存放点**：[Constants.ts → GameEvents](file:///workspace/assets/scripts/core/Constants.ts)
- 形式：`export const GameEvents = { KEY: 'event-name', ... } as const;`
- KEY 用 UPPER_SNAKE_CASE，值用 kebab-case（运行时事件名）

### 21.2 强制规则

1. **所有事件名必须先在 `GameEvents` 中定义**，禁止在业务代码里直接写字符串字面量
2. 调用 `eventCenter.emit/on/off/once` 时，第一个参数（事件名）**必须是 `GameEvents.XXX`**，禁止字符串字面量
3. 例外：
   - 引擎内置事件 `Node.EventType.TOUCH_START` 等，不属于本规范
   - [EventCenter.ts](file:///workspace/assets/scripts/core/EventCenter.ts) 自身的方法签名（`event: string`）不算调用
4. 新增事件：先在 `GameEvents` 加 KEY 与值，再在业务代码里用 `GameEvents.KEY`

### 21.3 写法准则

```typescript
// ❌ 错误：散落字面量
eventCenter.emit('sun-change', this._sun);
eventCenter.on('zombie-die', this.onZombieDie, this);

// ✅ 正确：引用 GameEvents 常量
eventCenter.emit(GameEvents.SUN_CHANGE, this._sun);
eventCenter.on(GameEvents.ZOMBIE_DIE, this.onZombieDie, this);
```

### 21.4 自动化校验

[tools/check_assets.js](file:///workspace/tools/check_assets.js) 规则5 已实现事件字面量检测：
- 扫描 `assets/scripts/` 下所有 `.ts` 文件
- 检测 `eventCenter.emit/on/off/once(` 后第一个参数是否为字符串字面量（用 `'` 或 `"` 包裹）
- 命中即 fail
- 跳过 [EventCenter.ts](file:///workspace/assets/scripts/core/EventCenter.ts) 自身的方法签名

### 21.5 AI 协作约束

凡 AI 生成涉及事件相关代码，**Prompt 中必须包含本条禁令**，生成的代码若违反即视为生成失败。

---

## 22. 二进制资源走 LFS 红线（仓库膨胀硬约束）

> 本条为**红线**，违反即视为阻断合并的硬伤。二进制文件直提交会让仓库快速膨胀到 GB 级，clone/CI 都会受影响。

### 22.1 LFS 类型清单

[.gitattributes](file:///workspace/.gitattributes) 中已声明的 LFS 覆盖类型：

| 类别 | 后缀 |
|---|---|
| 图像 | `png` `jpg` `jpeg` `webp` `gif` `bmp` `tga` `psd` `pvr` `astc` `ktx` |
| 音频 | `mp3` `ogg` `wav` `flac` `m4a` `aac` |
| 视频 | `mp4` `webm` `mov` |
| 字体 | `ttf` `otf` `woff` `woff2` |
| 引擎二进制 | `dbbin` `bin` `pak` |
| 压缩包 | `zip` `7z` `rar` |

### 22.2 强制规则

1. **所有二进制资源文件必须由 LFS 管理**，禁止以普通 blob 形式直提交到 Git 仓库
2. 新增二进制类型时，必须同步更新 [.gitattributes](file:///workspace/.gitattributes) 加 LFS 规则
3. **跳过 LFS 走普通 blob**的提交（例如用 `git add --no-verify` 或临时改 .gitattributes 绕过）视为违规
4. 二进制文件**禁止改后缀名**绕过 LFS（如把 `.png` 改成 `.png.bak` 强行直提交）
5. 文本资源（`.ts/.json/.md/.meta/.prefab/.scene/.plist/.anim`）**必须**保持 `text eol=lf`，不得误入 LFS

### 22.3 LFS 安装与初始化

每位开发者首次 clone 项目前需安装 Git LFS：
- Windows/macOS：`brew install git-lfs` 或下载官方包
- Linux：`apt-get install git-lfs` / `yum install git-lfs`
- 安装后执行 `git lfs install`（一次性）
- Clone 项目后执行 `git lfs pull` 拉取所有 LFS 资源

CI 服务器也需预装 `git-lfs`，否则 checkout 后二进制会是 LFS 指针文件而非实际内容。

### 22.4 自动化校验

[tools/check_assets.js](file:///workspace/tools/check_assets.js) 规则6 已实现 LFS 合规检测：
- 解析 `.gitattributes`，提取所有 LFS 管理的后缀
- 扫描 `assets/` 下所有文件，凡后缀命中 LFS 清单但已被 Git 普通跟踪的，命中即 fail
- 单文件头部 LFS 指针特征（`version https://git-lfs.github.com/spec/v1`）也算违规——指针意味着 git attributes 没生效，已检入但内容未真正进 LFS

### 22.5 新增二进制类型流程

1. 在 [.gitattributes](file:///workspace/.gitattributes) 加 LFS 规则
2. 在 [tools/check_assets.js](file:///workspace/tools/check_assets.js) 的 `LFS_EXTS` 同步（脚本会自动读 .gitattributes，但若校验逻辑需要扩展类型再补）
3. 提交时确认 `git lfs ls-files` 列出该文件

---



## 附录 A：与已落地框架的对应关系

| 规范条目 | 已落地代码 |
|---|---|
| §1 引擎锁定 | [package.json](file:///workspace/package.json) `creator.version: 3.8.5` |
| §2 横屏 | [project.json](file:///workspace/settings/v2/packages/project.json) + [builder.json](file:///workspace/settings/v2/packages/builder.json) |
| §3 目录 | `/workspace/assets/scripts/{core,managers,plant,zombie,bullet,grid,config,ui}` |
| §5 单例/事件/对象池 | [GameManager](file:///workspace/assets/scripts/core/GameManager.ts)、[EventCenter](file:///workspace/assets/scripts/core/EventCenter.ts)、[Pool](file:///workspace/assets/scripts/core/Pool.ts) |
| §8 植物扩展流程 | [PlantBase](file:///workspace/assets/scripts/plant/PlantBase.ts) + [PlantConfig](file:///workspace/assets/scripts/config/PlantConfig.ts) |
| §12 Android | [builder.json](file:///workspace/settings/v2/packages/builder.json) |
| **§17 双目录同步** | [Constants.ts → PrefabPath/PoolKey/PrefabPathMap](file:///workspace/assets/scripts/core/Constants.ts) + [prefabs/](file:///workspace/assets/prefabs) ↔ [resources/prefabs/](file:///workspace/assets/resources/prefabs) |
| **§18 对象池强制回收** | [PlantBase.die()](file:///workspace/assets/scripts/plant/PlantBase.ts) + [ZombieBase.die()](file:///workspace/assets/scripts/zombie/ZombieBase.ts) + [BulletBase.recycle()](file:///workspace/assets/scripts/bullet/BulletBase.ts) + [Pool.put()](file:///workspace/assets/scripts/core/Pool.ts) |
| **§19 资源校验脚本** | [tools/check_assets.js](file:///workspace/tools/check_assets.js)（3 类校验，`node tools/check_assets.js` 执行） |
| **§20 update 内禁令** | 由 [tools/check_assets.js](file:///workspace/tools/check_assets.js) 规则4 自动校验 |
| **§21 事件集中定义** | [Constants.ts → GameEvents](file:///workspace/assets/scripts/core/Constants.ts)（16 个事件）+ 由 [tools/check_assets.js](file:///workspace/tools/check_assets.js) 规则5 自动校验 |
| **§22 二进制走 LFS** | [.gitattributes](file:///workspace/.gitattributes)（33 个二进制类型）+ 由 [tools/check_assets.js](file:///workspace/tools/check_assets.js) 规则6 自动校验 |

---

**签字生效**：本规范自 2026-09-23 起对全体开发成员生效。
