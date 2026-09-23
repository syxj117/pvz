/**
 * 阳光掉落系统
 * 1. 周期性从天空随机下落阳光（玩家点击拾取）
 * 2. 接收向日葵产出事件，在向日葵位置附近生成阳光
 * 3. 玩家点击阳光节点时回收并广播「阳光被拾取」事件
 */
import { _decorator, Component, Node, Vec3, Prefab, instantiate, UITransform, EventTouch } from 'cc';
import { SUN, PoolKey } from '../core/Constants';
import { eventCenter } from '../core/EventCenter';
import { poolManager } from '../core/Pool';

const { ccclass, property } = _decorator;

// 对象池 key 统一从 PoolKey 取，禁止字面量（见 TECH_SPEC §17）
const SUN_KEY = PoolKey.SUN;

@ccclass('SunDropSystem')
export class SunDropSystem extends Component {
