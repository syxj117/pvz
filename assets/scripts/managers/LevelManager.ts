/**
 * 关卡管理器
 * 负责关卡的加载、切换、关卡配置的读取
 */
import { _decorator, Component } from 'cc';
import { LEVEL_CONFIGS, LevelConfig } from '../config/LevelConfig';
import { eventCenter } from '../core/EventCenter';
import { GameEvents } from '../core/Constants';

const { ccclass } = _decorator;

@ccclass('LevelManager')
export class LevelManager extends Component {
    private _currentLevelIndex: number = 0;
    private _currentConfig: LevelConfig | null = null;

    public get currentConfig(): LevelConfig | null {
        return this._currentConfig;
    }

    public get currentLevelIndex(): number {
        return this._currentLevelIndex;
    }

    /** 加载当前关卡配置 */
    public loadCurrentLevel(): void {
        if (this._currentLevelIndex < 0 || this._currentLevelIndex >= LEVEL_CONFIGS.length) {
            console.warn('[LevelManager] invalid level index:', this._currentLevelIndex);
            return;
        }
        this._currentConfig = LEVEL_CONFIGS[this._currentLevelIndex];
    }

    /** 重新加载当前关卡 */
    public reloadLevel(): void {
        this.loadCurrentLevel();
    }

    /** 切换到下一关 */
    public nextLevel(): void {
        this._currentLevelIndex = Math.min(this._currentLevelIndex + 1, LEVEL_CONFIGS.length - 1);
        this.loadCurrentLevel();
    }

    /** 切换到指定关卡 */
    public gotoLevel(index: number): void {
        this._currentLevelIndex = index;
        this.loadCurrentLevel();
    }

    /** 通关检测 */
    public onAllWavesCleared(): void {
        eventCenter.emit(GameEvents.GAME_WIN);
    }
}
