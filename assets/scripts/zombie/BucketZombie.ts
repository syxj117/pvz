/**
 * 铁桶僵尸
 * 高耐久护甲，强度最高的常见僵尸之一
 */
import { _decorator } from 'cc';
import { ZombieBase } from './ZombieBase';
import { ZombieType } from '../core/Constants';

const { ccclass, property } = _decorator;

@ccclass('BucketZombie')
export class BucketZombie extends ZombieBase {
    public zombieType: string = ZombieType.BUCKET;

    @property
    public armorHp: number = 1100;

    private _armorBroken: boolean = false;

    public takeDamage(damage: number, slow: boolean = false): void {
        if (this._armorBroken) {
            super.takeDamage(damage, slow);
            return;
        }
        this.armorHp -= damage;
        if (this.armorHp <= 0) {
            this._armorBroken = true;
        }
        if (slow) {
            this._slowFactor = 0.5;
            this._slowTimer = 3;
        }
    }
}
