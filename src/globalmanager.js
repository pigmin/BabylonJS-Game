//Singleton like class

export const States = Object.freeze({
    STATE_NONE: 0,
    STATE_INIT: 10,
    STATE_LOADING: 20,
    STATE_PRE_INTRO: 22,
    STATE_MENU: 25,
    STATE_START_INTRO: 28,
    STATE_INTRO: 30,
    STATE_START_GAME: 35,
    STATE_LAUNCH: 40,
    STATE_NEW_LEVEL: 45,
    STATE_LEVEL_WELDING: 50,
    STATE_LEVEL_READY: 55,
    STATE_RUNNING: 60,
    STATE_PAUSE: 70,
    STATE_LOOSE: 80,
    STATE_GAME_OVER: 90,
    STATE_END: 100,
});

  
class GlobalManager {

    #canvas;
    #engine;
    #currentScene;
    #activeCamera;

    #gameState;

    glowLayer;
    shadowGenerator;

    static get instance() {
        return (globalThis[Symbol.for(`PF_${GlobalManager.name}`)] ||= new this());
    }

    get canvas() {
        return this.#canvas;
    }
    get engine() {
        return this.#engine;
    }
    
    get scene() {
        return this.#currentScene;
    }

    set scene(currentScene) {
        if (currentScene)
            this.#currentScene = currentScene;
    }

    set activeCamera(camera) {
        this.#activeCamera = camera;
    }

    get activeCamera() {
        return this.#activeCamera;
    }

    
    set gameState(newState) {
        this.#gameState = newState;
    }

    get gameState() {
        return this.#gameState;
    }

    constructor() { 
    }

    setup(canvas, engine) {
        this.#canvas = canvas;
        this.#engine = engine;
    }

    init() {

    }

    update() {
        
    }

    detroy() {
        
    }

    
    getRandomInt(max) {
        return Math.round(Math.random() * max);
    }
}

//Destructuring on ne prends que la propriété statique instance
const {instance} = GlobalManager;
export { instance as GlobalManager };
