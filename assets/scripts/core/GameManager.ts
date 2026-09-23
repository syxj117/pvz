/**
 * 游戏主管理器
 * 单例模式，控制整局游戏的生命周期与各子系统的协调
 */
import { _decorator, Component, director, Node } from 'cc';
import { GameState, GameEvents } from './Constants';
import { eventCenter } from './EventCenter';
import { LevelManager } from '../managers/LevelManager';
import { SunManager } from '../managers/SunManager';
import { WaveManager } from '../managers/WaveManager';
import { UIManager } from '../managers/UIManager';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    private static _instance: GameManager | null = null;

    @property(LevelManager)
    public levelManager: LevelManager | null = null;

    @property(SunManager)
    public sunManager: SunManager | null = null;

    @property(WaveManager)
    public waveManager: WaveManager | null = null;

    @property(UIManager)
    public uiManager: UIManager | null = null;

    private _state: GameState = GameState.INIT;

    public static get instance(): GameManager {
        return GameManager._instance!;
    }

    public get state(): GameState {
        return this._state;
    }

    onLoad(): void {
        if (GameManager._instance && GameManager._instance !== this) {
            this.destroy();
            return;
        }
        GameManager._instance = this;
        director.addPersistRootNode(this.node);
    }

    onDestroy(): void {
        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
    }

    start(): void {
        this.changeState(GameState.READY);
    }

    /** 切换游戏状态并广播事件 */
    public changeState(state: GameState): void {
        if (this._state === state) return;
        this._state = state;
        eventCenter.emit(GameEvents.GAME_STATE_CHANGE, state);
        switch (state) {
            case GameState.PLAYING:
                this.waveManager?.startWaves();
                break;
            case GameState.WIN:
                eventCenter.emit(GameEvents.GAME_WIN);
                break;
            case GameState.LOSE:
                eventCenter.emit(GameEvents.GAME_LOSE);
                break;
        }
    }

    /** 开始一局新游戏 */
    public startGame(): void {
        this.sunManager?.reset();
        this.levelManager?.loadCurrentLevel();
        this.changeState(GameState.PLAYING);
    }

    /** 暂停游戏 */
    public pause(): void {
        if (this._state === GameState.PLAYING) {
            this.changeState(GameState.PAUSED);
        }
    }

    /** 恢复游戏 */
    public resume(): void {
        if (this._state === GameState.PAUSED) {
            this.changeState(GameState.PLAYING);
        }
    }

    /** 重启当前关卡 */
    public restartLevel(): void {
        this.levelManager?.reloadLevel();
        this.startGame();
    }
}
