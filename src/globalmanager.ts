//Singleton like class

import { Camera, Engine, GlowLayer, Scene, ShadowGenerator } from "@babylonjs/core";

export const enum States {
    STATE_NONE = 0,
    STATE_INIT,
    STATE_LOADING,
    STATE_PRE_INTRO,
    STATE_MENU,
    STATE_START_INTRO,
    STATE_INTRO,
    STATE_START_GAME,
    STATE_LAUNCH,
    STATE_NEW_LEVEL,
    STATE_LEVEL_WELDING,
    STATE_LEVEL_READY,
    STATE_RUNNING,
    STATE_PAUSE,
    STATE_LOOSE,
    STATE_GAME_OVER,
    STATE_END,
};

  
class GlobalManager {

    private _canvas?: HTMLCanvasElement;
    private _engine?: Engine;
    private _currentScene?: Scene;
    private _activeCamera?: Camera;

    private _gameState: States;

    private _glowLayer?: GlowLayer;
    private _shadowGenerator?: ShadowGenerator;

    static get instance() {
        return ((globalThis as any)[Symbol.for(`PF_${GlobalManager.name}`)] ||= new this());
    }

    get canvas() {
        return this._canvas;
    }
    get engine() {
        return this._engine;
    }
    
    get scene() {
        return this._currentScene;
    }

    set scene(currentScene) {
        if (currentScene)
            this._currentScene = currentScene;
    }

    set activeCamera(camera) {
        this._activeCamera = camera;
    }

    get activeCamera() {
        return this._activeCamera;
    }

    
    public set gameState(newState: States) {
        this._gameState = newState;
    }

    public get gameState(): States {
        return this._gameState;
    }

    constructor() { 
        this._gameState = States.STATE_INIT;
    }
    

    setup(canvas: HTMLCanvasElement, engine: Engine): void {
        this._canvas = canvas;
        this._engine = engine;
    }

    init(): void {

    }

    update(): void {
        
    }

    detroy(): void {
        
    }

    
    getRandomInt(max: number): number {
        return Math.round(Math.random() * max);
    }
}

//Destructuring on ne prends que la propriété statique instance
const {instance} = GlobalManager;
export { instance as GlobalManager };
