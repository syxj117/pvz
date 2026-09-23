/**
 * 僵尸基类
 * 通用移动、受到攻击减血、啃植物、抵达房屋判定等
 */
import { _decorator, Component, Vec3 } from 'cc';
import { ZombieType, GameEvents } from '../core/Constants';
import { ZombieConfig, ZOMBIE_CONFIGS } from '../config/ZombieConfig';
import { eventCenter } from '../core/EventCenter';
import { poolManager } from '../core/Pool';

const { ccclass, property } = _decorator;

@ccclass('ZombieBase')
export class ZombieBase extends Component {
    @property({ type: String })
    public zombieType: string = '';

    public row: number = 0;

    protected _hp: number = 100;
    protected _speed: number = 20;
    protected _attack: number = 10;
    protected _config: ZombieConfig | null = null;
    protected _isDead: boolean = false;
    protected _isEating: boolean = false;
    protected _slowTimer: number = 0;
    protected _slowFactor: number = 1;

    protected get config(): ZombieConfig {
        if (!this._config) {
            this._config = ZOMBIE_CONFIGS[this.zombieType as ZombieType] || null;
        }
        return this._config!;
    }

    onLoad(): void {
        if (this.config) {
            this._hp = this.config.hp;
            this._speed = this.config.speed;
            this._attack = this.config.attack;
        }
    }

    /** 设置行号（生成时由 WaveManager 调用） */
    public setRow(row: number): void {
        this.row = row;
    }

    /** 受到子弹伤害 */
    public takeDamage(damage: number, slow: boolean = false): void {
        if (this._isDead) return;
        this._hp -= damage;
        if (slow) {
            this._slowFactor = 0.5;
            this._slowTimer = 3;
        }
        if (this._hp <= 0) {
            this.die();
        }
    }

    /** 范围伤害（樱桃炸弹等）调用 */
    public takeAreaDamage(damage: number): void {
        this.takeDamage(damage);
    }

    /** 进入啃植物状态 / 退出 */
    public setEating(eating: boolean): void {
        this._isEating = eating;
    }

    /** 死亡：广播事件后归还对象池（详见 TECH_SPEC §18 红线） */
    public die(): void {
        if (this._isDead) return;
        this._isDead = true;
        eventCenter.emit(GameEvents.ZOMBIE_DIE, this);
        this.node.active = false;
        if (this.zombieType) {
            poolManager.put(this.zombieType, this.node);
        } else {
            // 兜底：未注册到对象池，无池可归
            this.node.destroy();
        }
    }

    update(dt: number): void {
        if (this._isDead) return;
        // 减速效果倒计时
        if (this._slowTimer > 0) {
            this._slowTimer -= dt;
            if (this._slowTimer <= 0) {
                this._slowFactor = 1;
            }
        }
        if (this._isEating) return; // 啃植物时不动
        const pos = this.node.position;
        const nextX = pos.x - this._speed * this._slowFactor * dt;
        this.node.setPosition(new Vec3(nextX, pos.y, 0));
        // 抵达房屋
        if (nextX < -500) {
            eventCenter.emit(GameEvents.ZOMBIE_REACH_HOME, this);
            this.die();
        }
    }
}
