/**
 * 植物配置表
 * 每种植物的基础属性（HP、行为周期、生产成本等）
 * 后续可改为 JSON 在 resources 中动态加载
 */
import { PlantType } from '../core/Constants';

export interface PlantConfig {
    /** 植物类型 key */
    type: PlantType;
    /** 中文名 */
    name: string;
    /** 阳光成本 */
    cost: number;
    /** 生命值 */
    hp: number;
    /** 行为周期（秒）：发射子弹/产阳光的间隔 */
    actionInterval: number;
    /** 冷却时间（秒），用于卡牌栏的冷却显示 */
    cooldown: number;
    /** 卡牌图标资源路径（resources 下相对路径） */
    icon: string;
}

export const PLANT_CONFIGS: Record<PlantType, PlantConfig> = {
    [PlantType.SUNFLOWER]: {
        type: PlantType.SUNFLOWER,
        name: '向日葵',
        cost: 50,
        hp: 100,
        actionInterval: 8,
        cooldown: 7.5,
        icon: 'images/plants/sunflower',
    },
    [PlantType.PEASHOOTER]: {
        type: PlantType.PEASHOOTER,
        name: '豌豆射手',
        cost: 100,
        hp: 100,
        actionInterval: 1.5,
        cooldown: 7.5,
        icon: 'images/plants/peashooter',
    },
    [PlantType.SNOW_PEA]: {
        type: PlantType.SNOW_PEA,
        name: '寒冰射手',
        cost: 175,
        hp: 100,
        actionInterval: 1.5,
        cooldown: 7.5,
        icon: 'images/plants/snowpea',
    },
    [PlantType.REPEATER]: {
        type: PlantType.REPEATER,
        name: '双发射手',
        cost: 200,
        hp: 100,
        actionInterval: 1.5,
        cooldown: 7.5,
        icon: 'images/plants/repeater',
    },
    [PlantType.WALLNUT]: {
        type: PlantType.WALLNUT,
        name: '坚果墙',
        cost: 50,
        hp: 1000,
        actionInterval: 9999,
        cooldown: 15,
        icon: 'images/plants/wallnut',
    },
    [PlantType.CHERRY_BOMB]: {
        type: PlantType.CHERRY_BOMB,
        name: '樱桃炸弹',
        cost: 150,
        hp: 100,
        actionInterval: 9999,
        cooldown: 30,
        icon: 'images/plants/cherrybomb',
    },
};
