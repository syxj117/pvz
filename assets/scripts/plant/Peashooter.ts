/**
 * 豌豆射手
 * 周期性向右发射豌豆子弹
 */
import { _decorator, Vec3 } from 'cc';
import { PlantBase } from './PlantBase';
import { PlantType, BulletType, GameEvents } from '../core/Constants';
import { poolManager } from '../core/Pool';
import { eventCenter } from '../core/EventCenter';

const { ccclass, property } = _decorator;

@ccclass('Peashooter')
export class Peashooter extends PlantBase {
    public plantType: string = PlantType.PEASHOOTER;

    @property
    public bulletOffsetX: number = 30;
    @property
    public bulletOffsetY: number = 20;

    /** 发射一颗豌豆 */
    protected onAction(): void {
        const bullet = poolManager.get(BulletType.PEA);
        if (!bullet) return;
        const pos = this.node.position;
        bullet.setPosition(new Vec3(pos.x + this.bulletOffsetX, pos.y + this.bulletOffsetY, 0));
        bullet.parent = this.node.parent;
        bullet.active = true;
        // 让子弹脚本接收发射者的行号
        eventCenter.emit(GameEvents.BULLET_FIRED, bullet, this.row, BulletType.PEA);
    }
}
