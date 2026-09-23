/**
 * 通用对象池
 * 用于复用频繁创建/销毁的对象（如子弹、阳光、僵尸等），避免 GC 抖动
 * 使用 Prefab + instantiate 的方式管理节点对象
 */
import { Node, Prefab, instantiate, NodePool } from 'cc';

export class ObjectPool {
    private _pools: Map<string, NodePool> = new Map();
    private _prefabs: Map<string, Prefab> = new Map();

    /**
     * 注册某个类型的预制体，便于后续按需生成
     * @param name 类型名称
     * @param prefab 预制体资源
     * @param preloadCount 预加载个数
     */
    public register(name: string, prefab: Prefab, preloadCount: number = 0): void {
        this._prefabs.set(name, prefab);
        const pool = new NodePool();
        this._pools.set(name, pool);
        for (let i = 0; i < preloadCount; i++) {
            const node = instantiate(prefab);
            pool.put(node);
        }
    }

    /** 从池中获取一个节点；若池为空则根据预制体实例化 */
    public get(name: string): Node | null {
        const pool = this._pools.get(name);
        if (pool && pool.size() > 0) {
            return pool.get()!;
        }
        const prefab = this._prefabs.get(name);
        if (prefab) {
            return instantiate(prefab);
        }
        return null;
    }

    /** 将节点归还到池中（对象池内部兜底：无对应池时直接销毁，不算违规，见 TECH_SPEC §18.4） */
    public put(name: string, node: Node): void {
        const pool = this._pools.get(name);
        if (pool) {
            pool.put(node);
        } else {
            // 对象池自身兜底：调用方按 key 归还但该 key 未注册池，只能销毁
            node.destroy();
        }
    }

    /** 清空所有对象池 */
    public clear(): void {
        this._pools.forEach((pool) => pool.clear());
        this._pools.clear();
        this._prefabs.clear();
    }
}

/** 全局对象池单例 */
export const poolManager = new ObjectPool();
