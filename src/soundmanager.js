import { GlobalManager } from "./globalmanager";

import mainMusicUrl from "../assets/musics/Push-Long-Version(chosic.com).mp3";
import whistleSoundUrl from "../assets/sounds/271359__pistak23__moje-kratke-pisknutie.mp3";
import { AssetsManager, Sound } from "@babylonjs/core";


class SoundManager {
  static name = "SoundManager";

  
    SoundsFX = Object.freeze({
        WHISTLE: 7,
    })
    

    

    Musics = Object.freeze({
        START_MUSIC: 0,
    });

  #soundsFX = [];
  #musics = [];

  #prevMusic;

  static get instance() {
    return (globalThis[Symbol.for(`PF_${SoundManager.name}`)] ||= new this());
}

  constructor() {
    this.#prevMusic = null;
  }

  async init() {
    await this.loadAssets();
  }

  update() {
    //Gestion des actions (keydown / keyup -> Action)
  }


  
  playSound(soundIndex) {
    if (soundIndex >= 0 && soundIndex < this.#soundsFX.length)
        this.#soundsFX[soundIndex].play();
  }

  playMusic(musicIndex) {
    if (this.#prevMusic != null)
      this.#musics[this.#prevMusic].stop();
    if (musicIndex >= 0 && musicIndex < this.#musics.length) {
        this.#musics[musicIndex].play();
        this.#prevMusic = musicIndex;
    }
  }

  loadAssets() {
    return new Promise((resolve) => {

        // Asset manager for loading texture and particle system
        let assetsManager = new AssetsManager(GlobalManager.scene);

        const music0Data = assetsManager.addBinaryFileTask("music0", mainMusicUrl);
        const whistleSoundData = assetsManager.addBinaryFileTask("fireSound", whistleSoundUrl);

        // load all tasks
        assetsManager.load();

        // after all tasks done, set up particle system
        assetsManager.onFinish = (tasks) => {
            console.log("tasks successful", tasks);

            this.#musics[this.Musics.START_MUSIC] = new Sound("music0", music0Data.data, GlobalManager.scene, undefined, { loop: true, autoplay: false, volume: 0.4 });

            this.#soundsFX[this.SoundsFX.WHISTLE] = new Sound("fireSound", whistleSoundData.data, GlobalManager.scene);

            resolve(true);
        }

    });


}
}

const {instance} = SoundManager;
export { instance as SoundManager };
