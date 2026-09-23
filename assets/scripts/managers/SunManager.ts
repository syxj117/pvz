/**
 * 阳光管理器
 * 维护玩家当前持有的阳光数量，处理阳光的产出/消耗/拾取
 */
import { _decorator, Component } from 'cc';
import { SUN, GameEvents } from '../core/Constants';
import { eventCenter } from '../core/EventCenter';

const { ccclass, property } = _decorator;

@ccclass('SunManager')
export class SunManager extends Component {
    @property
    public initialSun: number = SUN.INIT_VALUE;

    private _sun: number = 0;

    public get sun(): number {
        return this._sun;
    }

    onLoad(): void {
        eventCenter.on(GameEvents.SUN_PICKED, this.onSunPicked, this);
    }

    onDestroy(): void {
        eventCenter.off(GameEvents.SUN_PICKED, this.onSunPicked, this);
    }

    /** 重置阳光到初始值 */
    public reset(): void {
        this._sun = this.initialSun;
        this.emitChange();
    }

    /** 增加阳光 */
    public add(value: number): void {
        this._sun += value;
        this.emitChange();
    }

    /** 消耗阳光；若不足返回 false */
    public consume(value: number): boolean {
        if (this._sun < value) return false;
        this._sun -= value;
        this.emitChange();
        return true;
    }

    /** 判断是否足够 */
    public hasEnough(value: number): boolean {
        return this._sun >= value;
    }

    private onSunPicked(value: number): void {
        this.add(value);
    }

    private emitChange(): void {
        eventCenter.emit(GameEvents.SUN_CHANGE, this._sun);
    }
}
