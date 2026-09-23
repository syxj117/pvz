/**
 * 草坪网格系统
 * 维护 5×9 的格子坐标↔世界坐标映射，并管理每格植物的占位
 * 玩家点击网格放置植物时由本系统负责落位与冲突检测
 */
import { _decorator, Component, Vec3, EventTouch, UITransform, Node } from 'cc';
import { GRID, GameEvents } from '../core/Constants';
import { eventCenter } from '../core/EventCenter';
import { PlantBase } from '../plant/PlantBase';

const { ccclass, property } = _decorator;

@ccclass('LawnGrid')
export class LawnGrid extends Component {
    @property(Node)
    public plantRoot: Node | null = null;

    /** 二维数组 [row][col] 标记格子是否被占用，引用植物节点 */
    private _cells: (PlantBase | null)[][] = [];

    onLoad(): void {
        this.initCells();
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    }

    onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    }

    private initCells(): void {
        for (let r = 0; r < GRID.ROWS; r++) {
            this._cells[r] = [];
            for (let c = 0; c < GRID.COLS; c++) {
                this._cells[r][c] = null;
            }
        }
    }

    /** 网格坐标 → 世界坐标（节点本地坐标） */
    public cellToLocal(row: number, col: number): Vec3 {
        const x = GRID.ORIGIN_X + col * GRID.CELL_WIDTH + GRID.CELL_WIDTH / 2;
        const y = GRID.ORIGIN_Y - row * GRID.CELL_HEIGHT - GRID.CELL_HEIGHT / 2;
        return new Vec3(x, y, 0);
    }

    /** 触摸坐标 → 网格坐标；返回 null 表示点在网格外 */
    public localToCell(localX: number, localY: number): { row: number; col: number } | null {
        const col = Math.floor((localX - GRID.ORIGIN_X) / GRID.CELL_WIDTH);
        const row = Math.floor((GRID.ORIGIN_Y - localY) / GRID.CELL_HEIGHT);
        if (row < 0 || row >= GRID.ROWS || col < 0 || col >= GRID.COLS) return null;
        return { row, col };
    }

    /** 该格是否可种植 */
    public isCellEmpty(row: number, col: number): boolean {
        return this._cells[row]?.[col] == null;
    }

    /** 占用格子（植物放置时调用） */
    public occupy(row: number, col: number, plant: PlantBase): void {
        this._cells[row][col] = plant;
    }

    /** 释放格子（植物移除/死亡时调用） */
    public release(row: number, col: number): void {
        if (this._cells[row]) {
            this._cells[row][col] = null;
        }
    }

    /** 获取某格上的植物 */
    public getPlant(row: number, col: number): PlantBase | null {
        return this._cells[row]?.[col] ?? null;
    }

    private onTouchStart(event: EventTouch): void {
        const ui = this.node.getComponent(UITransform);
        if (!ui) return;
        const worldPos = event.getUILocation();
        const local = ui.convertToNodeSpaceAR(worldPos);
        const cell = this.localToCell(local.x, local.y);
        if (!cell) return;
        eventCenter.emit(GameEvents.GRID_TAPPED, cell.row, cell.col);
    }
}
