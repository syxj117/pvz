/**
 * 游戏内 HUD
 * 集中处理 HUD 的交互逻辑：阳光拾取反馈、暂停按钮、波次提示等
 */
import { _decorator, Component, Node, Label } from 'cc';
import { eventCenter } from '../core/EventCenter';
import { GameManager } from '../core/GameManager';
import { GameState, GameEvents } from '../core/Constants';

const { ccclass, property } = _decorator;

@ccclass('HUDUI')
export class HUDUI extends Component {
    @property(Node)
    public pauseButton: Node | null = null;

    @property(Label)
    public waveTipLabel: Label | null = null;

    onLoad(): void {
        eventCenter.on(GameEvents.WAVE_START, this.onWaveStart, this);
        eventCenter.on(GameEvents.GAME_WIN, this.onGameWin, this);
        eventCenter.on(GameEvents.GAME_LOSE, this.onGameLose, this);
        this.pauseButton?.on(Node.EventType.TOUCH_START, this.onPauseTapped, this);
    }

    onDestroy(): void {
        eventCenter.off(GameEvents.WAVE_START, this.onWaveStart, this);
        eventCenter.off(GameEvents.GAME_WIN, this.onGameWin, this);
        eventCenter.off(GameEvents.GAME_LOSE, this.onGameLose, this);
        this.pauseButton?.off(Node.EventType.TOUCH_START, this.onPauseTapped, this);
    }

    private onPauseTapped(): void {
        const gm = GameManager.instance;
        if (!gm) return;
        if (gm.state === GameState.PLAYING) gm.pause();
        else if (gm.state === GameState.PAUSED) gm.resume();
    }

    private onWaveStart(index: number, wave: any): void {
        if (this.waveTipLabel) this.waveTipLabel.string = wave?.name ?? `第 ${index + 1} 波`;
    }

    private onGameWin(): void {
        if (this.waveTipLabel) this.waveTipLabel.string = '胜利！';
    }

    private onGameLose(): void {
        if (this.waveTipLabel) this.waveTipLabel.string = '脑子被吃掉了！';
    }
}
