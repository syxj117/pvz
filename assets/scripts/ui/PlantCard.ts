/**
 * 单张植物卡牌
 * 显示图标、阳光成本、冷却进度
 * 玩家点击后选中本卡牌（成为「待种植」状态），等待在网格上落子
 */
import { _decorator, Component, Node, Sprite, Label, UIOpacity, tween, Vec3 } from 'cc';
import { PlantType, GameEvents } from '../core/Constants';
import { PLANT_CONFIGS, PlantConfig } from '../config/PlantConfig';
import { eventCenter } from '../core/EventCenter';

const { ccclass, property } = _decorator;

@ccclass('PlantCard')
export class PlantCard extends Component {
    @property({ type: String })
    public plantType: string = '';

    @property(Sprite)
    public iconSprite: Sprite | null = null;

    @property(Label)
    public costLabel: Label | null = null;

    @property(Node)
    public cooldownMask: Node | null = null;

    private _config: PlantConfig | null = null;
    private _cooldownTimer: number = 0;
    private _isReady: boolean = true;

    onLoad(): void {
        this._config = PLANT_CONFIGS[this.plantType as PlantType] || null;
        if (this._config) {
            if (this.costLabel) this.costLabel.string = String(this._config.cost);
        }
        if (this.cooldownMask) {
            const o = this.cooldownMask.getComponent(UIOpacity);
            if (o) o.opacity = 0;
        }
        this.node.on(Node.EventType.TOUCH_START, this.onCardTapped, this);
    }

    onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onCardTapped, this);
    }

    private onCardTapped(): void {
        if (!this._isReady || !this._config) return;
        eventCenter.emit(GameEvents.PLANT_SELECTED, this._config.type, this._config.cost);
    }

    /** 触发冷却 */
    public triggerCooldown(): void {
        if (!this._config) return;
        this._isReady = false;
        this._cooldownTimer = this._config.cooldown;
    }

    update(dt: number): void {
        if (this._isReady) return;
        this._cooldownTimer -= dt;
        if (this._cooldownTimer <= 0) {
            this._isReady = true;
            if (this.cooldownMask) {
                const o = this.cooldownMask.getComponent(UIOpacity);
                if (o) o.opacity = 0;
            }
        } else if (this.cooldownMask && this._config) {
            const o = this.cooldownMask.getComponent(UIOpacity);
            if (o) o.opacity = 180 * (this._cooldownTimer / this._config.cooldown);
        }
    }
}
