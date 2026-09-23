/**
 * 冰豌豆
 * 命中后使僵尸减速
 */
import { _decorator } from 'cc';
import { BulletBase } from './BulletBase';
import { BulletType } from '../core/Constants';

const { ccclass, property } = _decorator;

@ccclass('SnowPeaBullet')
export class SnowPeaBullet extends BulletBase {
    public bulletType: string = BulletType.SNOW_PEA;
    public override isSlow: boolean = true;

    @property
    public override speed: number = 400;

    @property
    public override damage: number = 20;
}
