/**
 * 卡牌栏
 * 管理本关可用植物的卡牌节点
 * 卡牌节点应在编辑器中按 availablePlants 顺序排列在 CardBar 节点下
 */
import { _decorator, Component, Node } from 'cc';
import { PlantType, GameEvents } from '../core/Constants';
import { eventCenter } from '../core/EventCenter';
import { PlantCard } from './PlantCard';

const { ccclass, property } = _decorator;

@ccclass('CardBarUI')
export class CardBarUI extends Component {
    @property([Node])
    public cardNodes: Node[] = [];

    onLoad(): void {
        eventCenter.on(GameEvents.PLANT_PLACED, this.onPlantPlaced, this);
    }

    onDestroy(): void {
        eventCenter.off(GameEvents.PLANT_PLACED, this.onPlantPlaced, this);
    }

    /** 植物放置成功后触发对应卡牌的冷却 */
    private onPlantPlaced(type: PlantType): void {
        const node = this.cardNodes.find((n) => {
            const card = n.getComponent(PlantCard);
            return card && card.plantType === type;
        });
        node?.getComponent(PlantCard)?.triggerCooldown();
    }
}
