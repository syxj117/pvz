/**
 * 普通僵尸
 * 无护甲的最低级僵尸
 */
import { _decorator } from 'cc';
import { ZombieBase } from './ZombieBase';
import { ZombieType } from '../core/Constants';

const { ccclass } = _decorator;

@ccclass('NormalZombie')
export class NormalZombie extends ZombieBase {
    public zombieType: string = ZombieType.NORMAL;
}
