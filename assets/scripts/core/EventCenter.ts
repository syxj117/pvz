/**
 * 全局事件中心
 * 基于 Cocos Creator EventTarget 实现，提供全局事件的注册/分发/移除
 * 解耦各模块之间的直接引用，所有跨模块通信都通过事件完成
 */
import { EventTarget } from 'cc';

class EventCenter {
    private _target: EventTarget = new EventTarget();

    /** 注册事件监听 */
    public on(event: string, callback: (...args: any[]) => void, target?: any): void {
        this._target.on(event, callback, target);
    }

    /** 注册一次性事件监听（触发一次后自动移除） */
    public once(event: string, callback: (...args: any[]) => void, target?: any): void {
        this._target.once(event, callback, target);
    }

    /** 取消事件监听 */
    public off(event: string, callback: (...args: any[]) => void, target?: any): void {
        this._target.off(event, callback, target);
    }

    /** 派发事件 */
    public emit(event: string, ...args: any[]): void {
        this._target.emit(event, ...args);
    }

    /** 移除某个 target 上的所有事件监听 */
    public removeAll(target?: any): void {
        if (target) {
            this._target.targetOff(target);
        }
    }
}

/** 全局事件中心单例 */
export const eventCenter = new EventCenter();
