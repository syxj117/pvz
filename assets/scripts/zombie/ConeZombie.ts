/**
 * 路障僵尸
 * 头顶有路障护甲，护甲被击破前优先承受伤害
 */
import { _decorator } from 'cc';
import { ZombieBase } from './ZombieBase';
import { ZombieType } from '../core/Constants';

const { ccclass, property } = _decorator;

@ccclass('ConeZombie')
export class ConeZombie extends ZombieBase {
    public zombieType: string = ZombieType.CONE;

    @property
    public armorHp: number = 280;

    private _armorBroken: boolean = false;

    /** 路障优先承受伤害 */
    public takeDamage(damage: number, slow: boolean = false): void {
        if (this._armorBroken) {
            super.takeDamage(damage, slow);
            return;
        }
        this.armorHp -= damage;
        if (this.armorHp <= 0) {
            this._armorBroken = true;
            // 触发护甲破碎表现，由表现层接收
        }
        if (slow) {
            // 减速效果传给本体
            this._slowFactor = 0.5;
            this._slowTimer = 3;
        }
    }
}
