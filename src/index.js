//Gyruss
import { Engine } from "@babylonjs/core/Engines/engine";

import Game from "./game";

let canvas;
let engine;

const babylonInit = async () => {
    
    // Get the canvas element
    canvas = document.getElementById("renderCanvas");
    // Generate the BABYLON 3D engine
    engine = new Engine(canvas, false, {
            adaptToDeviceRatio: true,
        });
    //Stencil is for hightlayer, unused in this projet 
    //engine = new Engine(canvas, false, {stencil: true});
    
    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize();
    });
};

babylonInit().then(() => {
    // scene started rendering, everything is initialized
    // Register a render loop to repeatedly render the scene
    // Create the scene
    const game = new Game(canvas, engine);
    game.start();

});


