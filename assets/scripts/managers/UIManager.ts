/**
 * UI 管理器
 * 负责各 UI 面板的显示/隐藏与公共 UI 状态更新
 * 具体 UI 控件由各自组件处理，本管理器仅做集中调度入口
 */
import { _decorator, Component, Node } from 'cc';
import { GameState, GameEvents } from '../core/Constants';
import { eventCenter } from '../core/EventCenter';

const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    @property(Node)
    public hudNode: Node | null = null;            // 游戏内 HUD（阳光数/卡牌栏）

    @property(Node)
    public pausePanel: Node | null = null;        // 暂停面板

    @property(Node)
    public winPanel: Node | null = null;          // 胜利面板

    @property(Node)
    public losePanel: Node | null = null;         // 失败面板

    @property(Node)
    public readyPanel: Node | null = null;        // 开局准备面板

    onLoad(): void {
        eventCenter.on(GameEvents.GAME_STATE_CHANGE, this.onStateChange, this);
        eventCenter.on(GameEvents.SUN_CHANGE, this.onSunChange, this);
    }

    onDestroy(): void {
        eventCenter.off(GameEvents.GAME_STATE_CHANGE, this.onStateChange, this);
        eventCenter.off(GameEvents.SUN_CHANGE, this.onSunChange, this);
    }

    private onStateChange(state: GameState): void {
        this.setAllPanelsInactive();
        switch (state) {
            case GameState.READY:
                this.readyPanel && (this.readyPanel.active = true);
                break;
            case GameState.PLAYING:
                this.hudNode && (this.hudNode.active = true);
                break;
            case GameState.PAUSED:
                this.pausePanel && (this.pausePanel.active = true);
                this.hudNode && (this.hudNode.active = true);
                break;
            case GameState.WIN:
                this.winPanel && (this.winPanel.active = true);
                break;
            case GameState.LOSE:
                this.losePanel && (this.losePanel.active = true);
                break;
        }
    }

    private onSunChange(value: number): void {
        // 由 HUD 子组件监听更新具体显示，此处仅作 hook
    }

    private setAllPanelsInactive(): void {
        [this.readyPanel, this.pausePanel, this.winPanel, this.losePanel].forEach((n) => {
            if (n) n.active = false;
        });
    }
}
