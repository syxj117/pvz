/**
 * 看报僵尸
 * 受到一定伤害后会进入暴怒状态，速度大幅提升
 */
import { _decorator } from 'cc';
import { ZombieBase } from './ZombieBase';
import { ZombieType } from '../core/Constants';

const { ccclass, property } = _decorator;

@ccclass('NewspaperZombie')
export class NewspaperZombie extends ZombieBase {
    public zombieType: string = ZombieType.NEWSPAPER;

    @property
    public rageTriggerHp: number = 100;

    @property
    public rageSpeedMul: number = 3;

    private _enraged: boolean = false;

    public takeDamage(damage: number, slow: boolean = false): void {
        super.takeDamage(damage, slow);
        if (!this._enraged && this._hp <= this.rageTriggerHp) {
            this.enterRage();
        }
    }

    private enterRage(): void {
        this._enraged = true;
        this._speed *= this.rageSpeedMul;
        // 触发暴怒表现事件，由表现层接收
    }
}
