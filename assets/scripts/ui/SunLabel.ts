/**
 * 阳光数量显示
 * 监听 sun-change 事件并刷新 Label
 */
import { _decorator, Component, Label } from 'cc';
import { eventCenter } from '../core/EventCenter';
import { GameEvents } from '../core/Constants';

const { ccclass, property } = _decorator;

@ccclass('SunLabel')
export class SunLabel extends Component {
    @property(Label)
    public label: Label | null = null;

    onLoad(): void {
        eventCenter.on(GameEvents.SUN_CHANGE, this.onSunChange, this);
    }

    onDestroy(): void {
        eventCenter.off(GameEvents.SUN_CHANGE, this.onSunChange, this);
    }

    private onSunChange(value: number): void {
        if (this.label) {
            this.label.string = String(value);
        }
    }
}
