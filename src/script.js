import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import getGui from "./utilities/debug-gui";
import {
  initSound,
  setAnalyserMeshVisibility,
  updateCustomFrequencyBandData,
  getAnalyserUniformData,
  getAudioElement,
} from "./utilities/audio-analyser";

import "./style.css";

const debugValues = {
  disableAudio: false,
  isAnalyzerMeshVisible: true,
  showAxesHelper: false,
  showGui: true,
};

/**
 * Base
 */
// Debug
const gui = getGui();
if (!debugValues.showGui) {
  gui.destroy();
}

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Textures
 */

/**
 * Test mesh
 */
// Geometry

// Material

// Mesh

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

gui.add(debugValues, "showAxesHelper").name("Show axes helper");

/**
 * Sizes
 */

function getSizes() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  if (windowWidth > windowHeight) {
    return {
      width: windowHeight,
      height: windowHeight,
    };
  }

  return {
    width: windowWidth,
    height: windowWidth,
  };
}

let sizes = getSizes();

window.addEventListener("resize", () => {
  // Update sizes
  sizes = getSizes();
  console.log("sizes", sizes);

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0.25, -0.25, 1);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  updateCustomFrequencyBandData();
  setAnalyserMeshVisibility(debugValues.isAnalyzerMeshVisible);
  axesHelper.visible = debugValues.showAxesHelper;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

if (debugValues.disableAudio) {
  const overlay = document.getElementById("overlay");
  overlay.remove();

  //   initSoundConnectedGeometry();

  tick();
} else {
  // const fullscreenButton = document.getElementById("startFullscreen");
  // fullscreenButton.addEventListener("click", () => {
  //   document.documentElement.requestFullscreen();
  // });

  // if (debugValues.shouldPlayAll) {
  //   fullscreenButton.remove();
  // }

  const startButton = document.getElementById("startButton");
  startButton.addEventListener("click", onStartButtonClick);

  function onStartButtonClick() {
    const waitForAudioReadyInterval = setInterval(() => {
      if (getAudioElement().readyState == 4) {
        clearInterval(waitForAudioReadyInterval);

        initSound({ scene, renderer });
        // initSoundConnectedGeometry();

        const overlay = document.getElementById("overlay");
        overlay.remove();

        // if (debugValues.shouldRecord) {
        //   canvas.style.cursor = "none";
        // }

        tick();

        return;
      }
    }, 100);

    startButton.innerHTML = "Loading...";
  }
}