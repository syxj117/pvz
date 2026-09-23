/**
 * 场景启动入口
 * 挂载在场景的常驻节点（如「GameRoot」）上，负责：
 *   1. 注册各类预制体到对象池（植物/僵尸/子弹/阳光）
 *   2. 在编辑器中把各预制体按 @property 拖入即可
 *   3. 启动游戏
 *
 * 使用说明：
 *   - 本脚本挂在场景中的「GameRoot」节点上
 *   - 在编辑器属性面板把对应 Prefab 资源拖入下方的 @property 槽
 *   - 启动后会自动注册对象池，并通过 GameManager.startGame() 进入游戏
 */
import { _decorator, Component, Prefab } from 'cc';
import { PlantType, ZombieType, BulletType, PoolKey } from './core/Constants';
import { poolManager } from './core/Pool';
import { GameManager } from './core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('GameStart')
export class GameStart extends Component {
    // ===== 植物预制体（按需拖入） =====
    @property({ type: Prefab, tooltip: '向日葵预制体' })
    public sunflowerPrefab: Prefab | null = null;

    @property({ type: Prefab, tooltip: '豌豆射手预制体' })
    public peashooterPrefab: Prefab | null = null;

    @property({ type: Prefab, tooltip: '坚果墙预制体' })
    public wallnutPrefab: Prefab | null = null;

    @property({ type: Prefab, tooltip: '樱桃炸弹预制体' })
    public cherryBombPrefab: Prefab | null = null;

    @property({ type: Prefab, tooltip: '寒冰射手预制体' })
    public snowPeaPrefab: Prefab | null = null;

    @property({ type: Prefab, tooltip: '双发射手预制体' })
    public repeaterPrefab: Prefab | null = null;

    // ===== 僵尸预制体 =====
    @property({ type: Prefab, tooltip: '普通僵尸预制体' })
    public normalZombiePrefab: Prefab | null = null;

    @property({ type: Prefab, tooltip: '路障僵尸预制体' })
    public coneZombiePrefab: Prefab | null = null;

    @property({ type: Prefab, tooltip: '铁桶僵尸预制体' })
    public bucketZombiePrefab: Prefab | null = null;

    @property({ type: Prefab, tooltip: '看报僵尸预制体' })
    public newspaperZombiePrefab: Prefab | null = null;

    // ===== 子弹预制体 =====
    @property({ type: Prefab, tooltip: '豌豆子弹预制体' })
    public peaPrefab: Prefab | null = null;

    @property({ type: Prefab, tooltip: '冰豌豆子弹预制体' })
    public snowPeaBulletPrefab: Prefab | null = null;

    // ===== 阳光预制体 =====
    @property({ type: Prefab, tooltip: '阳光节点预制体' })
    public sunPrefab: Prefab | null = null;

    start(): void {
        this.registerPrefabs();
        // 通过 GameManager 启动一局
        GameManager.instance?.startGame();
    }

    /** 把预制体注册到对象池，方便后续按类型 key 取出 */
    private registerPrefabs(): void {
        const map: Array<[string, Prefab | null]> = [
            [PlantType.SUNFLOWER, this.sunflowerPrefab],
            [PlantType.PEASHOOTER, this.peashooterPrefab],
            [PlantType.WALLNUT, this.wallnutPrefab],
            [PlantType.CHERRY_BOMB, this.cherryBombPrefab],
            [PlantType.SNOW_PEA, this.snowPeaPrefab],
            [PlantType.REPEATER, this.repeaterPrefab],
            [ZombieType.NORMAL, this.normalZombiePrefab],
            [ZombieType.CONE, this.coneZombiePrefab],
            [ZombieType.BUCKET, this.bucketZombiePrefab],
            [ZombieType.NEWSPAPER, this.newspaperZombiePrefab],
            [BulletType.PEA, this.peaPrefab],
            [BulletType.SNOW_PEA, this.snowPeaBulletPrefab],
            [PoolKey.SUN, this.sunPrefab],
        ];
        for (const [key, prefab] of map) {
            if (prefab) {
                poolManager.register(key, prefab, 4);
            }
        }
    }
}
