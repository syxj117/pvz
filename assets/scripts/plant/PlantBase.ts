/**
 * 植物基类
 * 所有植物共享的生命周期、受到僵尸攻击的减血、种植时的网格归属等通用逻辑
 * 具体植物（向日葵、豌豆射手等）继承本类并实现 onAction/onPlaced 等
 */
import { _decorator, Component, Vec3 } from 'cc';
import { PlantType } from '../core/Constants';
import { PlantConfig, PLANT_CONFIGS } from '../config/PlantConfig';
import { poolManager } from '../core/Pool';

const { ccclass, property } = _decorator;

@ccclass('PlantBase')
export class PlantBase extends Component {
    /** 植物类型 */
    @property({ type: String })
    public plantType: string = '';

    /** 当前所在行（0~4） */
    public row: number = 0;

    /** 当前所在列（0~8） */
    public col: number = 0;

    protected _hp: number = 100;
    protected _config: PlantConfig | null = null;
    protected _actionTimer: number = 0;
    protected _isDead: boolean = false;

    protected get config(): PlantConfig {
        if (!this._config) {
            this._config = PLANT_CONFIGS[this.plantType as PlantType] || null;
        }
        return this._config!;
    }

    onLoad(): void {
        if (this.config) {
            this._hp = this.config.hp;
        }
    }

    /** 被种植到网格上时回调 */
    public onPlaced(row: number, col: number): void {
        this.row = row;
        this.col = col;
        this._actionTimer = 0;
    }

    /** 受到攻击 */
    public takeDamage(damage: number): void {
        if (this._isDead) return;
        this._hp -= damage;
        if (this._hp <= 0) {
            this.die();
        }
    }

    /** 死亡处理：归还对象池，便于复用（详见 TECH_SPEC §18 红线） */
    public die(): void {
        if (this._isDead) return;
        this._isDead = true;
        this.node.active = false;
        if (this.plantType) {
            poolManager.put(this.plantType, this.node);
        } else {
            // 兜底：未注册到对象池，无池可归
            this.node.destroy();
        }
    }

    update(dt: number): void {
        if (this._isDead || !this.config) return;
        this._actionTimer += dt;
        if (this._actionTimer >= this.config.actionInterval) {
            this._actionTimer = 0;
            this.onAction();
        }
    }

    /**
     * 植物的核心行为，由子类实现
     * 例如：向日葵产阳光、豌豆射手发射子弹、坚果墙无行为
     */
    protected onAction(): void {
        // 默认空实现，子类覆盖
    }
}
