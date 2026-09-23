/**
 * 双发射手
 * 每个周期连续发射两颗豌豆
 */
import { _decorator, Vec3 } from 'cc';
import { PlantBase } from './PlantBase';
import { PlantType, BulletType, GameEvents } from '../core/Constants';
import { poolManager } from '../core/Pool';
import { eventCenter } from '../core/EventCenter';

const { ccclass, property } = _decorator;

@ccclass('Repeater')
export class Repeater extends PlantBase {
    public plantType: string = PlantType.REPEATER;

    @property
    public bulletOffsetX: number = 30;
    @property
    public bulletOffsetY: number = 20;
    @property
    public secondShotDelay: number = 0.15;

    private _secondShotPending: boolean = false;
    private _secondShotTimer: number = 0;

    protected onAction(): void {
        this.fireOne();
        this._secondShotPending = true;
        this._secondShotTimer = 0;
    }

    update(dt: number): void {
        super.update(dt);
        if (this._secondShotPending) {
            this._secondShotTimer += dt;
            if (this._secondShotTimer >= this.secondShotDelay) {
                this._secondShotPending = false;
                this.fireOne();
            }
        }
    }

    private fireOne(): void {
        const bullet = poolManager.get(BulletType.PEA);
        if (!bullet) return;
        const pos = this.node.position;
        bullet.setPosition(new Vec3(pos.x + this.bulletOffsetX, pos.y + this.bulletOffsetY, 0));
        bullet.parent = this.node.parent;
        bullet.active = true;
        eventCenter.emit(GameEvents.BULLET_FIRED, bullet, this.row, BulletType.PEA);
    }
}
