/**
 * 全局常量定义
 * 集中管理游戏中使用的常量，便于后期调参与维护
 */

/** 网格相关常量：5 行 9 列的经典 PVZ 草坪布局 */
export const GRID = {
    ROWS: 5,
    COLS: 9,
    CELL_WIDTH: 90,
    CELL_HEIGHT: 100,
    ORIGIN_X: -360,
    ORIGIN_Y: 220,
} as const;

/** 阳光系统常量 */
export const SUN = {
    INIT_VALUE: 50,          // 初始阳光数量
    PICKUP_RADIUS: 60,        // 阳光点击拾取半径
    DROP_VALUE: 25,           // 天降阳光价值
    SUNFLOWER_VALUE: 25,     // 向日葵产出阳光价值
    DROP_INTERVAL: 10,       // 天降阳光间隔（秒）
} as const;

/** 游戏阶段 */
export enum GameState {
    INIT = 0,
    READY = 1,
    PLAYING = 2,
    PAUSED = 3,
    WIN = 4,
    LOSE = 5,
}

/** 植物类型枚举 */
export enum PlantType {
    SUNFLOWER = 'Sunflower',
    PEASHOOTER = 'Peashooter',
    WALLNUT = 'Wallnut',
    CHERRY_BOMB = 'CherryBomb',
    SNOW_PEA = 'SnowPea',
    REPEATER = 'Repeater',
}

/** 僵尸类型枚举 */
export enum ZombieType {
    NORMAL = 'NormalZombie',
    CONE = 'ConeZombie',
    BUCKET = 'BucketZombie',
    NEWSPAPER = 'NewspaperZombie',
}

/** 子弹类型枚举 */
export enum BulletType {
    PEA = 'Pea',
    SNOW_PEA = 'SnowPea',
}

/** 全局事件名称 */
export const GameEvents = {
    SUN_CHANGE: 'sun-change',                 // 阳光数量变化
    SUN_PICKED: 'sun-picked',                // 阳光被拾取
    PLANT_SELECTED: 'plant-selected',        // 玩家选择植物卡片
    PLANT_PLACED: 'plant-placed',            // 植物被种植到网格
    PLANT_REMOVED: 'plant-removed',          // 植物被铲除
    ZOMBIE_DIE: 'zombie-die',               // 僵尸死亡
    ZOMBIE_REACH_HOME: 'zombie-reach-home', // 僵尸抵达房屋
    WAVE_START: 'wave-start',                // 一波僵尸开始
    WAVE_END: 'wave-end',                    // 一波僵尸结束
    GAME_STATE_CHANGE: 'game-state-change', // 游戏状态变化
    GAME_WIN: 'game-win',                    // 游戏胜利
    GAME_LOSE: 'game-lose',                  // 游戏失败
    GRID_TAPPED: 'grid-tapped',              // 玩家点击网格
    SUNFLOWER_PRODUCE: 'sunflower-produce', // 向日葵产出阳光
    BULLET_FIRED: 'bullet-fired',           // 子弹发射
    AREA_DAMAGE: 'area-damage',             // 范围伤害（樱桃炸弹）
} as const;

/** 层级名称（场景节点 Layer 用） */
export const LayerNames = {
    BACKGROUND: 'Background',
    GRID: 'Grid',
    ENTITY: 'Entity',
    UI: 'UI',
    TOP: 'Top',
} as const;

/**
 * 预制体路径常量（资源红线：唯一来源）
 * ----------------------------------------------------------------------------
 * 规范（见 docs/TECH_SPEC.md §3 / §17）：
 *   1. prefabs/   —— 编辑器拖拽用；与 resources/prefabs/ 同结构、同文件名
 *   2. resources/prefabs/ —— 运行时 resources.load 用
 *   3. 两目录必须保持同名镜像，新增/重命名/删除必须同步，否则视为红线违规
 *   4. 所有运行时取预制体的路径必须从本 PrefabPath 取，禁止散落字符串字面量
 * ----------------------------------------------------------------------------
 * 命名约定：KEY = 'prefabs/<category>/<Name>'，与 resources/prefabs/ 下的相对路径完全一致（不带扩展名）
 */
export const PrefabPath = {
    // ===== 植物 =====
    SUNFLOWER: 'prefabs/plants/Sunflower',
    PEASHOOTER: 'prefabs/plants/Peashooter',
    WALLNUT: 'prefabs/plants/Wallnut',
    CHERRY_BOMB: 'prefabs/plants/CherryBomb',
    SNOW_PEA: 'prefabs/plants/SnowPea',
    REPEATER: 'prefabs/plants/Repeater',

    // ===== 僵尸 =====
    NORMAL_ZOMBIE: 'prefabs/zombies/NormalZombie',
    CONE_ZOMBIE: 'prefabs/zombies/ConeZombie',
    BUCKET_ZOMBIE: 'prefabs/zombies/BucketZombie',
    NEWSPAPER_ZOMBIE: 'prefabs/zombies/NewspaperZombie',

    // ===== 子弹 =====
    PEA: 'prefabs/bullets/Pea',
    SNOW_PEA_BULLET: 'prefabs/bullets/SnowPea',

    // ===== 阳光/特效/UI =====
    SUN: 'prefabs/effects/Sun',
    EXPLOSION: 'prefabs/effects/Explosion',
    PLANT_CARD: 'prefabs/ui/PlantCard',
} as const;

/**
 * 对象池 key 集中常量
 * 对象池 key 不等于路径，但同样需要统一管理，避免散落字符串字面量
 * 注：PlantType/ZombieType/BulletType 枚举值本身即为对应实体的对象池 key
 *      此处仅补充非枚举类的实体（如阳光/特效）
 */
export const PoolKey = {
    SUN: 'Sun',
    EXPLOSION: 'Explosion',
    PLANT_CARD: 'PlantCard',
} as const;

/**
 * 类型 → 预制体路径映射
 * 运行时按枚举 key 直接拿到 resources/prefabs/ 下的相对路径
 * 新增类型时必须在此处补一行，否则 poolManager/resources.load 找不到
 */
export const PrefabPathMap: Record<string, string> = {
    // 植物
    [PlantType.SUNFLOWER]: PrefabPath.SUNFLOWER,
    [PlantType.PEASHOOTER]: PrefabPath.PEASHOOTER,
    [PlantType.WALLNUT]: PrefabPath.WALLNUT,
    [PlantType.CHERRY_BOMB]: PrefabPath.CHERRY_BOMB,
    [PlantType.SNOW_PEA]: PrefabPath.SNOW_PEA,
    [PlantType.REPEATER]: PrefabPath.REPEATER,
    // 僵尸
    [ZombieType.NORMAL]: PrefabPath.NORMAL_ZOMBIE,
    [ZombieType.CONE]: PrefabPath.CONE_ZOMBIE,
    [ZombieType.BUCKET]: PrefabPath.BUCKET_ZOMBIE,
    [ZombieType.NEWSPAPER]: PrefabPath.NEWSPAPER_ZOMBIE,
    // 子弹
    [BulletType.PEA]: PrefabPath.PEA,
    [BulletType.SNOW_PEA]: PrefabPath.SNOW_PEA_BULLET,
    // 阳光（对象池 key 与路径统一通过 SUN）
    [PoolKey.SUN]: PrefabPath.SUN,
};
