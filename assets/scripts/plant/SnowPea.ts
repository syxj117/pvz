/**
 * 寒冰射手
 * 发射冰豌豆，命中僵尸后造成减速效果
 */
import { _decorator, Vec3 } from 'cc';
import { PlantBase } from './PlantBase';
import { PlantType, BulletType, GameEvents } from '../core/Constants';
import { poolManager } from '../core/Pool';
import { eventCenter } from '../core/EventCenter';

const { ccclass, property } = _decorator;

@ccclass('SnowPea')
export class SnowPea extends PlantBase {
    public plantType: string = PlantType.SNOW_PEA;

    @property
    public bulletOffsetX: number = 30;
    @property
    public bulletOffsetY: number = 20;

    protected onAction(): void {
        const bullet = poolManager.get(BulletType.SNOW_PEA);
        if (!bullet) return;
        const pos = this.node.position;
        bullet.setPosition(new Vec3(pos.x + this.bulletOffsetX, pos.y + this.bulletOffsetY, 0));
        bullet.parent = this.node.parent;
        bullet.active = true;
        eventCenter.emit(GameEvents.BULLET_FIRED, bullet, this.row, BulletType.SNOW_PEA);
    }
}
