/**
 * 向日葵
 * 周期性产出阳光，是玩家的主要阳光来源
 */
import { _decorator } from 'cc';
import { PlantBase } from './PlantBase';
import { PlantType } from '../core/Constants';
import { SUN, GameEvents } from '../core/Constants';
import { eventCenter } from '../core/EventCenter';

const { ccclass } = _decorator;

@ccclass('Sunflower')
export class Sunflower extends PlantBase {
    public plantType: string = PlantType.SUNFLOWER;

    /** 产阳光的行为（具体阳光节点生成由 SunDropSystem 负责挂接） */
    protected onAction(): void {
        eventCenter.emit(GameEvents.SUNFLOWER_PRODUCE, this.row, this.col, SUN.SUNFLOWER_VALUE);
    }
}
