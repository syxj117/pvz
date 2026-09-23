/**
 * 子弹基类
 * 沿当前行向右匀速移动，命中同行的僵尸造成伤害
 * 实际的命中检测由 BulletSystem（系统层）完成
 */
import { _decorator, Component, Node, Vec3 } from 'cc';
import { BulletType } from '../core/Constants';
import { poolManager } from '../core/Pool';

const { ccclass, property } = _decorator;

@ccclass('BulletBase')
export class BulletBase extends Component {
    @property({ type: String })
    public bulletType: string = '';

    @property
    public speed: number = 400;

    @property
    public damage: number = 20;

    /** 是否带减速效果（SnowPea 的冰豌豆使用） */
    public isSlow: boolean = false;

    public row: number = 0;
    private _active: boolean = false;

    /** 由植物发射时调用，绑定行号并激活 */
    public init(row: number): void {
        this.row = row;
        this._active = true;
    }

    update(dt: number): void {
        if (!this._active) return;
        const pos = this.node.position;
        const nextX = pos.x + this.speed * dt;
        this.node.setPosition(new Vec3(nextX, pos.y, 0));
        // 飞出屏幕后回收
        if (nextX > 700) {
            this.recycle();
        }
    }

    /** 命中目标后回收 */
    public onHit(): void {
        this.recycle();
    }

    /** 归还对象池（详见 TECH_SPEC §18 红线） */
    public recycle(): void {
        this._active = false;
        this.node.active = false;
        if (this.bulletType) {
            poolManager.put(this.bulletType, this.node);
        } else {
            // 兜底：未注册到对象池，无池可归
            this.node.destroy();
        }
    }
}
