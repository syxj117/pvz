/**
 * 豌豆
 * 普通子弹，不带减速效果
 */
import { _decorator } from 'cc';
import { BulletBase } from './BulletBase';
import { BulletType } from '../core/Constants';

const { ccclass, property } = _decorator;

@ccclass('Pea')
export class Pea extends BulletBase {
    public bulletType: string = BulletType.PEA;

    @property
    public override speed: number = 400;

    @property
    public override damage: number = 20;
}
