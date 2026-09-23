/**
 * 植物放置控制器
 * 监听「玩家选中卡牌」与「玩家点击网格」事件，完成植物放置：
 *   1. 校验阳光是否足够
 *   2. 校验网格是否空闲
 *   3. 实例化植物预制体并落到对应格
 *   4. 扣减阳光、广播 plant-placed 事件
 */
import { _decorator, Component, Node, Vec3, Prefab, instantiate, resources } from 'cc';
import { PlantType, PrefabPathMap, GameEvents } from '../core/Constants';
import { eventCenter } from '../core/EventCenter';
import { poolManager } from '../core/Pool';
import { SunManager } from '../managers/SunManager';
import { LawnGrid } from '../grid/LawnGrid';
import { PlantBase } from '../plant/PlantBase';
import { PLANT_CONFIGS } from '../config/PlantConfig';

const { ccclass, property } = _decorator;

@ccclass('PlantPlacer')
export class PlantPlacer extends Component {
    @property(SunManager)
    public sunManager: SunManager | null = null;

    @property(LawnGrid)
    public lawnGrid: LawnGrid | null = null;

    @property(Node)
    public plantRoot: Node | null = null;

    private _selectedType: PlantType | null = null;

    onLoad(): void {
        eventCenter.on(GameEvents.PLANT_SELECTED, this.onPlantSelected, this);
        eventCenter.on(GameEvents.GRID_TAPPED, this.onGridTapped, this);
    }

    onDestroy(): void {
        eventCenter.off(GameEvents.PLANT_SELECTED, this.onPlantSelected, this);
        eventCenter.off(GameEvents.GRID_TAPPED, this.onGridTapped, this);
    }

    private onPlantSelected(type: PlantType, cost: number): void {
        if (this.sunManager && !this.sunManager.hasEnough(cost)) {
            // 阳光不足：取消选择，UI 上可以做红光提示
            this._selectedType = null;
            return;
        }
        this._selectedType = type;
    }

    private onGridTapped(row: number, col: number): void {
        if (!this._selectedType) return;
        if (!this.lawnGrid || !this.lawnGrid.isCellEmpty(row, col)) return;
        const config = PLANT_CONFIGS[this._selectedType];
        if (!config) return;
        if (this.sunManager && !this.sunManager.consume(config.cost)) return;

        const type = this._selectedType;
        // 优先从对象池取；池中无可用节点时回退到 resources.load 预制体
        const node = poolManager.get(type);
        if (node) {
            this.placeNode(node, row, col, type);
            return;
        }
        // 路径必须从 PrefabPathMap 取，禁止字面量拼字符串（见 TECH_SPEC §17）
        const prefabPath = PrefabPathMap[type];
        if (!prefabPath) {
            console.warn('[PlantPlacer] no prefab path registered for type:', type);
            this._selectedType = null;
            return;
        }
        resources.load(prefabPath, Prefab, (err, prefab) => {
            if (err || !prefab) {
                console.warn('[PlantPlacer] load prefab failed:', prefabPath, err);
                return;
            }
            // 注册到对象池，便于后续复用
            poolManager.register(type, prefab, 0);
            const inst = instantiate(prefab);
            this.placeNode(inst, row, col, type);
        });
    }

    /** 把节点落到网格上 */
    private placeNode(node: Node, row: number, col: number, type: PlantType): void {
        if (!this.lawnGrid) return;
        const pos = this.lawnGrid.cellToLocal(row, col);
        node.setPosition(pos);
        node.parent = this.plantRoot || this.node;
        node.active = true;
        const plant = node.getComponent(PlantBase);
        if (plant) {
            plant.onPlaced(row, col);
            this.lawnGrid.occupy(row, col, plant);
        }
        eventCenter.emit(GameEvents.PLANT_PLACED, type, row, col);
        this._selectedType = null;
    }
}
