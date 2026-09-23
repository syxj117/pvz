/**
 * 波次管理器
 * 根据关卡配置控制僵尸的生成节奏与波次推进
 */
import { _decorator, Component, Vec3 } from 'cc';
import { eventCenter } from '../core/EventCenter';
import { LevelManager } from './LevelManager';
import { WaveData, ZombieSpawnEntry } from '../config/LevelConfig';
import { ZombieType, GameEvents } from '../core/Constants';
import { poolManager } from '../core/Pool';

const { ccclass, property } = _decorator;

@ccclass('WaveManager')
export class WaveManager extends Component {
    @property(LevelManager)
    public levelManager: LevelManager | null = null;

    @property
    public spawnNodeX: number = 720;   // 僵尸出生 X 坐标（屏幕右侧）

    @property
    public rowYList: number[] = [];   // 各行 Y 坐标

    private _waveIndex: number = 0;
    private _waveTimer: number = 0;
    private _spawnQueue: ZombieSpawnEntry[] = [];
    private _spawnIndex: number = 0;
    private _activeZombieCount: number = 0;
    private _running: boolean = false;

    onLoad(): void {
        eventCenter.on(GameEvents.ZOMBIE_DIE, this.onZombieDie, this);
        eventCenter.on(GameEvents.ZOMBIE_REACH_HOME, this.onZombieDie, this);
    }

    onDestroy(): void {
        eventCenter.off(GameEvents.ZOMBIE_DIE, this.onZombieDie, this);
        eventCenter.off(GameEvents.ZOMBIE_REACH_HOME, this.onZombieDie, this);
    }

    /** 开启波次推进 */
    public startWaves(): void {
        if (!this.levelManager || !this.levelManager.currentConfig) return;
        this._waveIndex = 0;
        this._running = true;
        this.loadNextWave();
    }

    /** 停止波次推进 */
    public stopWaves(): void {
        this._running = false;
        this._spawnQueue = [];
    }

    update(dt: number): void {
        if (!this._running) return;
        this._waveTimer += dt;
        this.trySpawnFromQueue();
    }

    private loadNextWave(): void {
        const config = this.levelManager?.currentConfig;
        if (!config) return;
        if (this._waveIndex >= config.waves.length) {
            // 所有波次结束且无残留僵尸 → 胜利
            if (this._activeZombieCount === 0) {
                this.stopWaves();
                eventCenter.emit(GameEvents.GAME_WIN);
            }
            return;
        }
        const wave: WaveData = config.waves[this._waveIndex];
        this._spawnQueue = wave.spawnList.slice();
        this._spawnIndex = 0;
        this._waveTimer = 0;
        eventCenter.emit(GameEvents.WAVE_START, this._waveIndex, wave);
    }

    private trySpawnFromQueue(): void {
        if (this._spawnIndex >= this._spawnQueue.length) return;
        const entry = this._spawnQueue[this._spawnIndex];
        if (this._waveTimer >= entry.delay) {
            this.spawnZombie(entry.type, entry.row);
            this._spawnIndex++;
        }
    }

    /** 生成一个僵尸并加入场景 */
    private spawnZombie(type: ZombieType, row: number): void {
        const node = poolManager.get(type);
        if (!node) {
            console.warn('[WaveManager] zombie prefab not registered:', type);
            return;
        }
        const y = this.rowYList[row] ?? 0;
        node.setPosition(new Vec3(this.spawnNodeX, y, 0));
        node.parent = this.node;
        this._activeZombieCount++;
        node.active = true;
    }

    private onZombieDie(): void {
        this._activeZombieCount = Math.max(0, this._activeZombieCount - 1);
        if (this._activeZombieCount === 0 && this._spawnIndex >= this._spawnQueue.length) {
            eventCenter.emit(GameEvents.WAVE_END, this._waveIndex);
            this._waveIndex++;
            this.loadNextWave();
        }
    }
}
