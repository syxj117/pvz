/**
 * 樱桃炸弹
 * 落地后短延迟爆炸，对范围内所有僵尸造成大量伤害
 */
import { _decorator, Vec3 } from 'cc';
import { PlantBase } from './PlantBase';
import { PlantType, GameEvents } from '../core/Constants';
import { eventCenter } from '../core/EventCenter';

const { ccclass, property } = _decorator;

@ccclass('CherryBomb')
export class CherryBomb extends PlantBase {
    public plantType: string = PlantType.CHERRY_BOMB;

    @property
    public explodeDelay: number = 1.0;

    @property
    public damage: number = 1800;

    @property
    public affectRadius: number = 150;

    private _exploded: boolean = false;
    private _timer: number = 0;

    update(dt: number): void {
        if (this._exploded) return;
        this._timer += dt;
        if (this._timer >= this.explodeDelay) {
            this.explode();
        }
    }

    private explode(): void {
        this._exploded = true;
        const pos = this.node.position;
        eventCenter.emit(GameEvents.AREA_DAMAGE, pos.x, pos.y, this.affectRadius, this.damage);
        this.die();
    }
}
