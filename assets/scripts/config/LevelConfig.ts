/**
 * 关卡配置表
 * 描述每关的波次构成、僵尸生成节奏、玩家可选植物等
 */
import { PlantType, ZombieType } from '../core/Constants';

/** 单只僵尸的生成条目 */
export interface ZombieSpawnEntry {
    /** 僵尸类型 */
    type: ZombieType;
    /** 出现的行号（0~4） */
    row: number;
    /** 相对波次开始时刻的延迟（秒） */
    delay: number;
}

/** 一波僵尸 */
export interface WaveData {
    /** 波次名称，用于 UI 提示（如「最后一波」） */
    name: string;
    /** 是否是最后一波（结算/进度提示用） */
    isFinal: boolean;
    /** 本波僵尸生成列表 */
    spawnList: ZombieSpawnEntry[];
}

/** 关卡配置 */
export interface LevelConfig {
    /** 关卡编号（从 1 开始） */
    id: number;
    /** 关卡名称 */
    name: string;
    /** 玩家本关可选植物 */
    availablePlants: PlantType[];
    /** 初始阳光（覆盖默认值，0 表示用默认） */
    initialSun: number;
    /** 波次列表，按顺序推进 */
    waves: WaveData[];
}

export const LEVEL_CONFIGS: LevelConfig[] = [
    {
        id: 1,
        name: '关卡 1-1',
        availablePlants: [PlantType.SUNFLOWER, PlantType.PEASHOOTER, PlantType.WALLNUT],
        initialSun: 50,
        waves: [
            {
                name: '第 1 波',
                isFinal: false,
                spawnList: [
                    { type: ZombieType.NORMAL, row: 2, delay: 0 },
                ],
            },
            {
                name: '第 2 波',
                isFinal: false,
                spawnList: [
                    { type: ZombieType.NORMAL, row: 1, delay: 0 },
                    { type: ZombieType.NORMAL, row: 3, delay: 3 },
                ],
            },
            {
                name: '最后一波',
                isFinal: true,
                spawnList: [
                    { type: ZombieType.NORMAL, row: 0, delay: 0 },
                    { type: ZombieType.NORMAL, row: 4, delay: 1 },
                    { type: ZombieType.CONE, row: 2, delay: 2 },
                ],
            },
        ],
    },
    {
        id: 2,
        name: '关卡 1-2',
        availablePlants: [
            PlantType.SUNFLOWER, PlantType.PEASHOOTER, PlantType.WALLNUT,
            PlantType.SNOW_PEA,
        ],
        initialSun: 75,
        waves: [
            {
                name: '第 1 波',
                isFinal: false,
                spawnList: [
                    { type: ZombieType.NORMAL, row: 2, delay: 0 },
                    { type: ZombieType.NORMAL, row: 1, delay: 4 },
                ],
            },
            {
                name: '最后一波',
                isFinal: true,
                spawnList: [
                    { type: ZombieType.CONE, row: 0, delay: 0 },
                    { type: ZombieType.CONE, row: 4, delay: 1 },
                    { type: ZombieType.BUCKET, row: 2, delay: 3 },
                    { type: ZombieType.NORMAL, row: 1, delay: 5 },
                    { type: ZombieType.NORMAL, row: 3, delay: 5 },
                ],
            },
        ],
    },
];
