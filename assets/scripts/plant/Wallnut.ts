/**
 * 坚果墙
 * 高血量植物，没有攻击行为，仅用于阻挡僵尸前进
 */
import { _decorator } from 'cc';
import { PlantBase } from './PlantBase';
import { PlantType } from '../core/Constants';

const { ccclass } = _decorator;

@ccclass('Wallnut')
export class Wallnut extends PlantBase {
    public plantType: string = PlantType.WALLNUT;

    // 坚果墙无需行为，沿用基类的空 onAction
}
