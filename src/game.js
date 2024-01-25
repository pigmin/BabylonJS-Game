//Gyruss

import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { Scene } from "@babylonjs/core/scene";
import { Color3, AssetsManager, ShadowGenerator, DirectionalLight, Animation, Engine, CubeTexture, GlowLayer, FlyCamera, MeshBuilder, StandardMaterial, Texture, EnvironmentHelper, HemisphericLight, Color4, UniversalCamera } from "@babylonjs/core";



import { Inspector } from '@babylonjs/inspector';

import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version
import "@babylonjs/loaders/glTF";



import * as constants from "./constants";
import { GlobalManager, States } from "./globalmanager";
import { InputController } from "./inputcontroller";
import { SoundManager } from "./soundmanager";


//ASSETS
import envfileUrl from "../assets/env/environment.env";


import { AdvancedDynamicTexture, Button, Control, TextBlock } from "@babylonjs/gui";

import environmentModelUrl from "../assets/gltf/plovdiv_roman_stadium.glb";
import olympicLogoModel from "../assets/gltf/olympic_games_symbol_materials.glb";

//const StartButtonMeshTarget = "panel_plate.001_140";


let nbLives = constants.START_LIVES;
let currentScore = 0;
let currentHighScore = 0;
let currentLevel = 1;



class Game {

  #gameScene;
  #assetsManager;
  #glowLayer;

  #bPause = false;

  #bInspector = false;

  #meshesArray = [];
  #meshes = [];
  #lights = {};
  #cameras = {};


  #menuUiTexture;
  #gameUI;
  #creditsUI;

  #timeToLaunch = 0;
  #cameraStartPosition = new Vector3(33.45, 17.0, -25);
  #cameraStartTarget = new Vector3(-9, -8, 22);

  #cameraMenuPosition = new Vector3(3.35, 3.18, -3.55);
  #cameraMenuTarget = new Vector3(-9, -8, 22);

  #cameraGamePosition = new Vector3(8.33, 5.66, -6.13);
  #cameraGameTarget = new Vector3(-32.37, -13.54, -0.11);   

  constructor(canvas, engine) {

    GlobalManager.setup(canvas, engine);

  }

  async start() {

    await this.init();
    //this.loadMenuGUI();
    this.loadGameUI();

    this.loop();
    this.end();
  }

  async init() {
    // Create our first scene.
    this.#gameScene = new Scene(GlobalManager.engine);
    GlobalManager.scene = this.#gameScene;
    GlobalManager.scene.clearColor = new Color3(.4, .4, .9);

    this.#glowLayer = new GlowLayer("glowLayer", GlobalManager.scene,);
    GlobalManager.glowLayer = this.#glowLayer;
    GlobalManager.glowLayer.intensity = 1.2;



    // standard ArcRotate camera
    //this.#cameras.main = new UniversalCamera("camera", this.#cameraStartPosition, GlobalManager.scene);
    this.#cameras.main = new UniversalCamera("camera", this.#cameraStartPosition, GlobalManager.scene);
    this.#cameras.main.minZ = 0.001;
    this.#cameras.main.maxZ = 20000;
    this.#cameras.main.wheelDeltaPercentage = 0.1;

    this.#cameras.main.setTarget(this.#cameraStartTarget);
    this.#cameras.main.attachControl(GlobalManager.canvas, true);
    this.#cameras.main.useFramingBehavior = true;

    //GlobalManager.scene.environmentTexture 

    // if not setting the envtext of the scene, we have to load the DDS module as well
    var envOptions = {
      environmentTexture : new CubeTexture(envfileUrl, GlobalManager.scene),
      skyboxTexture: envfileUrl,
      skyboxSize : 10000,
      createGround: true,
      groundSize : 500,
      groundColor : new Color4(.59, .50, .48, 1),
      //enableGroundMirror: true,
      groundYBias: 0.01,
      groundShadowLevel: 0.6,
  };
  GlobalManager.env = GlobalManager.scene.createDefaultEnvironment(envOptions);

//MeshBuilder.CreateBox("bb", {size:1});
   
    GlobalManager.activeCamera = this.#cameras.main;
   
    

    // directional light needed for shadows
    this.#lights.hemisphericlight = new HemisphericLight(
        "light",
        new Vector3(0, 1, 0),
        GlobalManager.scene
    );

    // Default intensity is 1. Let's dim the light a small amount
    this.#lights.hemisphericlight.intensity = 0.4;


    //For game phase enabled laer
    this.#lights.dirLight = new DirectionalLight("dirLight", new Vector3(0.8, -0.5, 0.4), GlobalManager.scene);
    //this.#lights.dirLight.position = new Vector3(-0.28, 3.78, -0.98);
    this.#lights.dirLight.diffuse = Color3.FromInts(255, 251, 199);
    this.#lights.dirLight.intensity = 6;
    
    
    GlobalManager.shadowGenerator = new ShadowGenerator(1024, this.#lights.dirLight);
    GlobalManager.shadowGenerator.frustumEdgeFalloff = 1.0;
    GlobalManager.shadowGenerator.bias = 0.00001;
    GlobalManager.shadowGenerator.normalBias = 0.01;
    GlobalManager.shadowGenerator.usePercentageCloserFiltering  = true;
    GlobalManager.shadowGenerator.setDarkness(0.0);

    InputController.init();
    await SoundManager.init();

    await this.loadAssets();


    GlobalManager.gameState = (States.STATE_PRE_INTRO);
    this.launchCreditsAnimation(() => {
      this.#creditsUI.rootContainer.isVisible = false;
      SoundManager.playMusic(SoundManager.Musics.START_MUSIC);
    });
    this.launchPreIntroAnimation(() => {
      GlobalManager.gameState = (States.STATE_MENU);
    });


  }

  launchGameOverAnimation(callback) {

    const startFrame = 0;
    const endFrame = 300;
    const frameRate = 60;

    var animationcamera = new Animation(
      "GameOverAnimation",
      "position",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var keys = [];
    keys.push({
      frame: startFrame,
      value: this.#cameraGamePosition
      //outTangent: new Vector3(1, 0, 0)
    });
    keys.push({
      frame: endFrame,
      value: this.#cameraMenuPosition,
      //outTangent: new Vector3(1, 0, 0)
    });
    animationcamera.setKeys(keys);

    //------------------TARGET
    var animationcameraTarget = new Animation(
      "GameOverAnimationTarget",
      "target",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var keysTarget = [];
    keysTarget.push({
      frame: startFrame,
      //inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraGameTarget,
    });
    keysTarget.push({
      frame: endFrame,
      value: this.#cameraMenuTarget,
      //outTangent: new Vector3(1, 0, 0)
    });

    animationcameraTarget.setKeys(keysTarget);

    this.#cameras.main.animations = [];
    this.#cameras.main.animations.push(animationcamera);
    this.#cameras.main.animations.push(animationcameraTarget);

    GlobalManager.scene.beginAnimation(this.#cameras.main, startFrame, endFrame, false, 1, callback);
  }

  launchGameStartAnimation(callback) {

    const startFrame = 0;
    const endFrame = 300;
    const frameRate = 60;

    var animationcamera = new Animation(
      "GameStartAnimation",
      "position",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var keys = [];
    keys.push({
      frame: startFrame,
      value: this.#cameraMenuPosition,
      //outTangent: new Vector3(1, 0, 0)
    });

    keys.push({
      frame: endFrame,
      //inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraGamePosition,
    });
    animationcamera.setKeys(keys);

    //------------------TARGET
    var animationcameraTarget = new Animation(
      "GameStartAnimationTarget",
      "target",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var keysTarget = [];
    keysTarget.push({
      frame: startFrame,
      value: this.#cameraMenuTarget,
      //outTangent: new Vector3(1, 0, 0)
    });
    keysTarget.push({
      frame: endFrame,
      //inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraGameTarget,
    });

    animationcameraTarget.setKeys(keysTarget);

    this.#cameras.main.animations = [];
    this.#cameras.main.animations.push(animationcamera);
    this.#cameras.main.animations.push(animationcameraTarget);

    GlobalManager.scene.beginAnimation(this.#cameras.main, startFrame, endFrame, false, 1, callback);
  }

  launchPreIntroAnimation(callback) {

    const frameRate = 60;
    const startFrame = 0;
    const endFrame = 900;

    var animationcamera = new Animation(
      "PreIntroAnimation",
      "position",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    // console.log(animationcamera);
    var keys = [];
    keys.push({
      frame: startFrame,
      value: this.#cameraStartPosition,
      //outTangent: new Vector3(1, 0, 0)
    });
    keys.push({
      frame: endFrame/3 ,
      value: this.#cameraStartPosition,
      //outTangent: new Vector3(1, 0, 0)
    });    
    keys.push({
      frame: endFrame,
      //inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraMenuPosition,
    });
    animationcamera.setKeys(keys);


    this.#cameras.main.animations = [];
    this.#cameras.main.animations.push(animationcamera);

    GlobalManager.scene.beginAnimation(this.#cameras.main, startFrame, endFrame, false, 1, callback);
  }


  launchCreditsAnimation(callback) {

    const frameRate = 60;
    const startFrame = 0;
    const endFrame = 500;

    this.#creditsUI = AdvancedDynamicTexture.CreateFullscreenUI("creditsUI");
    // Text label
    let modelCredits = new TextBlock("modelCredits");
    modelCredits.text = "Stadiim model by Andrey Kuleshov";
    modelCredits.fontSize = "18px";
    modelCredits.fontFamily = "Courier New";
    modelCredits.color = "#aaaaaa";
    modelCredits.height = "52px";
    modelCredits.top = "-200px";
    modelCredits.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    modelCredits.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.#creditsUI.addControl(modelCredits);

    // Text label
    let musicCredits = new TextBlock("musicCredits");
    musicCredits.text = 'Music "Push" by Alex-Productions';
    musicCredits.fontSize = "18px";
    musicCredits.fontFamily = "Courier New";
    musicCredits.color = "#bbbbbb";
    musicCredits.height = "52px";
    musicCredits.top = "-300px";
    musicCredits.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    musicCredits.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.#creditsUI.addControl(musicCredits);


    // Text label
    let codingCredits = new TextBlock("codingCredits");
    codingCredits.text = "Code by ???";
    codingCredits.fontSize = "18px";
    codingCredits.fontFamily = "Courier New";
    codingCredits.color = "#ffffff";
    codingCredits.height = "52px";
    codingCredits.top = "-400px";
    codingCredits.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    codingCredits.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.#creditsUI.addControl(codingCredits);



    var modelCreditsMotion = new Animation("modelCreditsMotion", "top", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    var modelCreditsMotionKeys = [];
    //modelCredits.text = "Happy Holidays"; 
    modelCreditsMotionKeys.push({ frame: startFrame, value: -200 });
    modelCreditsMotionKeys.push({ frame: endFrame * 0.3, value: 50 });
    modelCreditsMotionKeys.push({ frame: endFrame * 0.9, value: 50 });
    modelCreditsMotionKeys.push({ frame: endFrame, value: -200 });
    modelCreditsMotion.setKeys(modelCreditsMotionKeys);

    GlobalManager.scene.beginDirectAnimation(modelCredits, [modelCreditsMotion], startFrame, endFrame, false, 1, callback);

    var musicCreditsMotion = new Animation("musicCreditsMotion", "top", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    var musicCreditsMotionKeys = [];
    //musicCredits.text = "Happy Holidays"; 
    musicCreditsMotionKeys.push({ frame: startFrame, value: -300 });
    musicCreditsMotionKeys.push({ frame: endFrame * 0.3, value: 200 });
    musicCreditsMotionKeys.push({ frame: endFrame * 0.9, value: 200 });
    musicCreditsMotionKeys.push({ frame: endFrame, value: -300 });
    musicCreditsMotion.setKeys(musicCreditsMotionKeys);

    GlobalManager.scene.beginDirectAnimation(musicCredits, [musicCreditsMotion], startFrame, endFrame, false, 1, callback);

    var codingCreditsMotion = new Animation("codingCreditsMotion", "top", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    var codingCreditsMotionKeys = [];
    //codingCredits.text = "Happy Holidays"; 
    codingCreditsMotionKeys.push({ frame: startFrame, value: -400 });
    codingCreditsMotionKeys.push({ frame: endFrame * 0.3, value: 350 });
    codingCreditsMotionKeys.push({ frame: endFrame * 0.9, value: 350 });
    codingCreditsMotionKeys.push({ frame: endFrame, value: -400 });
    codingCreditsMotion.setKeys(codingCreditsMotionKeys);

    GlobalManager.scene.beginDirectAnimation(codingCredits, [codingCreditsMotion], startFrame, endFrame, false, 1, callback);



  }

  loadAssets() {
    return new Promise((resolve) => {

      this.#assetsManager = new AssetsManager(GlobalManager.scene);

      
      this.LoadEntity(
        "environment",
        "",
        "",
        environmentModelUrl,
        this.#assetsManager,
        this.#meshesArray,
        { position: new Vector3(0, 0, 0), scaling: new Vector3(1, 1, 1)},
        GlobalManager.scene,
        true,
        (mesh) => {
          this.#meshes.environment = mesh;
          mesh.rotation = new Vector3(0, Math.PI, 0);
          mesh.freezeWorldMatrix();
          
        }
      );

      this.LoadEntity(
        "logo",
        "",
        "",
        olympicLogoModel,
        this.#assetsManager,
        this.#meshesArray,
        { position: new Vector3(0, 2, 0), scaling: new Vector3(0.5, .5, -.5) },
        GlobalManager.scene,
        true,
        (mesh) => {
          this.#meshes.logo = mesh;
          mesh.rotation = new Vector3(-Math.PI/2, -Math.PI/3, 0);
          let mat = GlobalManager.scene.getMaterialByName("Material.001");
          mat.emissiveColor = Color3.Blue();

          mat = GlobalManager.scene.getMaterialByName("Material.002");
          mat.emissiveColor = Color3.Yellow();

          mat = GlobalManager.scene.getMaterialByName("Material.003");
          mat.emissiveColor = Color3.Black();

          mat = GlobalManager.scene.getMaterialByName("Material.004");
          mat.emissiveColor = Color3.Green();

          mat = GlobalManager.scene.getMaterialByName("Material.005");
          mat.emissiveColor = Color3.Red();

          
         // mesh.freezeWorldMatrix();
        }
      );


      // load all tasks
      this.#assetsManager.load();

      // after all tasks done, set up particle system
      this.#assetsManager.onFinish = (tasks) => {
        console.log("tasks successful", tasks);
      
        
        resolve(true);
      }

    });
  }

  showEnvironment(bVisible) {

    for (let idx = 0; idx < this.#meshes.length; idx++) {
      let mesh = this.#meshes[idx];
      mesh.setEnabled(bVisible);
    }
  }

  loop() {
    // Render every frame
    const divFps = document.getElementById("fps");
    GlobalManager.engine.runRenderLoop(() => {

      const now = performance.now();

      InputController.update();
      SoundManager.update();
      GlobalManager.update();

      this.updateAllText();

      if (GlobalManager.gameState == States.STATE_PRE_INTRO) {
        //RAS
        this.#meshes.logo.rotation.y += Math.PI/100;
      }
      else if (GlobalManager.gameState == States.STATE_MENU) {

        this.#meshes.logo.rotation.y += Math.PI/200;

        if (InputController.actions["Space"]) {
          if (GlobalManager.gameState == States.STATE_MENU) {

            GlobalManager.gameState = (States.STATE_START_INTRO);
          }
        }


      }
      else if (GlobalManager.gameState == States.STATE_START_INTRO) {
        //this.#cameras.main.setTarget(this.#cameraGameTarget);
        GlobalManager.gameState = (States.STATE_INTRO);
        this.launchGameStartAnimation(() => {
          Engine.audioEngine.unlock();
          this.showGameUI(true);
          //SoundManager.playMusic(SoundManager.Musics.LEVEL1_MUSIC);
          GlobalManager.gameState = (States.STATE_START_GAME);
        });
      }
      else if (GlobalManager.gameState == States.STATE_INTRO) {
        //RAS
      }
      else if (GlobalManager.gameState == States.STATE_START_GAME) {
        GlobalManager.gameState = (States.STATE_NEW_LEVEL);
      }
      else if (GlobalManager.gameState == States.STATE_LAUNCH) {
          
      }
      else if (GlobalManager.gameState == States.STATE_NEW_LEVEL) {
        GlobalManager.gameState = (States.STATE_LEVEL_READY);

      }
      else if (GlobalManager.gameState == States.STATE_LEVEL_READY) {
        GlobalManager.gameState = (States.STATE_RUNNING);

      }
      else if (GlobalManager.gameState == States.STATE_LOOSE) {

        GlobalManager.gameState = (States.STATE_GAME_OVER);
      }
      else if (GlobalManager.gameState == States.STATE_GAME_OVER) {

        this.launchGameOverAnimation(() => {
          GlobalManager.gameState = (States.STATE_MENU);
        });
      }
      else if (GlobalManager.gameState == States.STATE_RUNNING) {


        //SPECIAL CONTROLS 
        if (InputController.actions["Escape"]) {
          GlobalManager.gameState = (States.STATE_GAME_OVER);
        }

        if (InputController.actions["KeyP"]) {
          this.#bPause = true;
          GlobalManager.gameState = (States.STATE_PAUSE);
        }

        //Real game update here...

      }
      else if (GlobalManager.gameState == States.STATE_PAUSE) {
        if (InputController.actions["KeyP"]) {
          this.#bPause = false;
          GlobalManager.gameState = (States.STATE_RUNNING);
        }

      }

      //Render : (auto)

      //Debug
      if (InputController.actions["KeyI"]) {
        this.#bInspector = !this.#bInspector;
        if (this.#bInspector) {
          Inspector.Show(GlobalManager.scene, { embedMode: true });
          console.log(this.#cameras.main);
          this.#cameras.main.attachControl(GlobalManager.canvas, true);

        }
        else {
          this.#cameras.main.detachControl();
          Inspector.Hide();
        }
      }

      //Fin update 
      InputController.endupdate();

      //Affichage FPS
      divFps.innerHTML = GlobalManager.engine.getFps().toFixed() + " fps";
      GlobalManager.scene.render();


    });
  }

  resetGame() {
    currentLevel = 1;

    nbLives = constants.START_LIVES;
    if (currentScore > currentHighScore)
      currentHighScore = currentScore;
    currentScore = 0;
  }

  end() { }


  LoadEntity(
    name,
    meshNameToLoad,
    url,
    file,
    manager,
    meshArray,
    props,
    scene,
    bEnableShadows,
    callback
  ) {
    const meshTask = manager.addMeshTask(name, meshNameToLoad, url, file);

    meshTask.onSuccess = function (task) {
      const parent = task.loadedMeshes[0];
      parent.name = name;

      meshArray.push(parent);

      if (props) {
        if (props.scaling) {
          parent.scaling.copyFrom(props.scaling);
        }
        if (props.position) {
          parent.position.copyFrom(props.position);
        }
        else
          parent.position = Vector3.Zero();

        if (props.rotation) {
          parent.rotationQuaternion = null;
          parent.rotation.copyFrom(props.rotation);
        }
        else
          parent.rotation = Vector3.Zero();

      }
      else {
        parent.position = Vector3.Zero();
        parent.rotation = Vector3.Zero();
      }

      if (bEnableShadows) {
        GlobalManager.shadowGenerator.addShadowCaster(parent, true);
        parent.receiveShadows = true;
        for (let mesh of parent.getChildMeshes()) {
          let mat = mesh.material;
          //Turn off because it breaks shadows
          mat.usePhysicalLightFalloff = false;
          mesh.receiveShadows = true;
          mesh.computeWorldMatrix(true);
        }
      }
      else
        parent.computeWorldMatrix(true);

      if (callback)
        callback(parent);
    };
    meshTask.onError = function (e) {
      console.log(e);
    };
  }

  showGUI() {
    // GUI

    this.#menuUiTexture.rootContainer.isVisible = true;
  }
  hideGUI() {
    this.#menuUiTexture.rootContainer.isVisible = false;
  }

  gotoGameCamera() {
    this.#cameras.main.position = this.#cameraGamePosition.clone();
    this.#cameras.main.setTarget(this.#cameraGameTarget);
  }

  loadMenuGUI() {/*
    // GUI
    let guiParent = GlobalManager.scene.getNodeByName(constants.START_BUTTON_MESH_TARGET);
    this.#cameras.main.setTarget(guiParent.getAbsolutePosition());

    var startGameButton = MeshBuilder.CreatePlane("startGameButton", { width: 10, depth: 10 });
    startGameButton.scaling = new Vector3(3.8, 16, 1);
    startGameButton.position = new Vector3(-259, 86, -361.3);
    startGameButton.rotation.x = Math.PI / 8;
    startGameButton.rotation.y = -Math.PI / 2;

    this.#menuUiTexture = AdvancedDynamicTexture.CreateForMesh(startGameButton);

    var button1 = Button.CreateSimpleButton("but1", "START");
    button1.width = 0.2;
    button1.height = 0.9;
    button1.color = "white";
    button1.fontSize = 64;
    button1.fontFamily = "Courier New";
    button1.background = "";
    button1.onPointerUpObservable.add(() => {
      if (GlobalManager.gameState == States.STATE_MENU)
        //this.hideGUI();
        GlobalManager.gameState = (States.STATE_START_INTRO);
    });
    this.#menuUiTexture.addControl(button1);
    this.showGUI();
*/
  }

  loadGameUI() {
    this.textScale = 1;
    let fontSize = 22 * this.textScale;
    let spacing = 150 * this.textScale;

    this.#gameUI = AdvancedDynamicTexture.CreateFullscreenUI("gameUI");

    //Score
    this.textScore = new TextBlock();
    this.textScore.color = "white";
    this.textScore.fontSize = fontSize;
    this.textScore.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.textScore.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.textScore.left = -spacing * 3;
    this.textScore.top = 20;
    this.#gameUI.addControl(this.textScore);

    // Level
    this.textLevel = new TextBlock();
    this.textLevel.color = "white";
    this.textLevel.fontSize = fontSize;
    this.textLevel.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.textLevel.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
    this.textLevel.left = -spacing;
    this.textLevel.top = 20;
    this.#gameUI.addControl(this.textLevel);

    // High score
    this.textHigh = new TextBlock();
    this.textHigh.color = "white";
    this.textHigh.fontSize = fontSize;
    this.textHigh.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.textHigh.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
    this.textHigh.left = spacing * 3;
    this.textHigh.top = 20;
    this.#gameUI.addControl(this.textHigh);

    // Lives
    this.textLives = new TextBlock("Score");
    this.textLives.color = "white";
    this.textLives.fontSize = fontSize;

    this.textLives.fontFamily = 'Courier New';
    this.textLives.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.textLives.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.textLives.left = spacing;
    this.textLives.top = 20;
    this.#gameUI.addControl(this.textLives);
    this.showGameUI(false);

    this.updateAllText();
    window.onresize = () => {
      this.getCanvasSize();
      this.fixTextScale();
    }
  }
  showGameUI(bActive) {
    this.#gameUI.rootContainer.isVisible = bActive;
  }
  updateAllText() {
    this.updateTextLives();
    this.updateTextScore();
    this.updateTextHighScore();
    this.updateTextLevel();
  }
  updateTextLives() {
    this.textLives.text = `Lifes : ${nbLives}`;
  }
  updateTextScore() {
    this.textScore.text = `Score : ${currentScore}`;
  }
  updateTextHighScore() {
    this.textHigh.text = `HighScore : ${currentHighScore}`;
  }

  updateTextLevel() {
    this.textLevel.text = `Level : ${currentLevel}`;
  }


  getCanvasSize() {
    GlobalManager.canvasWidth = document.querySelector("canvas").width;
    GlobalManager.canvasHeight = document.querySelector("canvas").height;
  }

  fixTextScale() {
    this.textScale = Math.min(1, GlobalManager.canvasWidth / 1280);
    let fontSize = 22 * this.textScale;
    let spacing = 150 * this.textScale;
    this.textLives.fontSize = fontSize;
    this.textLives.left = spacing;
    this.textScore.fontSize = fontSize;
    this.textLevel.fontSize = fontSize;
    this.textHigh.fontSize = fontSize;
    this.textScore.left = -spacing * 3;
    this.textLevel.left = -spacing;
    this.textHigh.left = spacing * 3;
  }



}

export default Game;