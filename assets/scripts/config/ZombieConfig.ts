/**
 * 僵尸配置表
 * 预制体路径不在此处声明，统一从 PrefabPathMap[zombieType] 查询
 * 见 docs/TECH_SPEC.md §17 双目录同步红线
 */
import { ZombieType } from '../core/Constants';

export interface ZombieConfig {
    type: ZombieType;
    name: string;
    hp: number;
    /** 移动速度（像素/秒），向左为负方向，这里取正值 */
    speed: number;
    /** 啃食攻击力（每秒伤害） */
    attack: number;
    /** 死亡掉落阳光概率（0~1） */
    sunDropChance: number;
}

export const ZOMBIE_CONFIGS: Record<ZombieType, ZombieConfig> = {
    [ZombieType.NORMAL]: {
        type: ZombieType.NORMAL,
        name: '普通僵尸',
        hp: 200,
        speed: 20,
        attack: 100,
        sunDropChance: 0.1,
    },
    [ZombieType.CONE]: {
        type: ZombieType.CONE,
        name: '路障僵尸',
        hp: 200,
        speed: 20,
        attack: 100,
        sunDropChance: 0.15,
    },
    [ZombieType.BUCKET]: {
        type: ZombieType.BUCKET,
        name: '铁桶僵尸',
        hp: 200,
        speed: 18,
        attack: 100,
        sunDropChance: 0.2,
    },
    [ZombieType.NEWSPAPER]: {
        type: ZombieType.NEWSPAPER,
        name: '看报僵尸',
        hp: 180,
        speed: 22,
        attack: 100,
        sunDropChance: 0.15,
    },
};
