import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import planeVertexShader from "./shaders/basic-plane/vertex.glsl";
import planeFragmentShader from "./shaders/basic-plane/fragment.glsl";

import getGui from "./utilities/debug-gui";
import {
  initSound,
  createAnalyserMesh,
  setAnalyserMeshVisibility,
  updateCustomFrequencyBandData,
  getAnalyserUniformData,
  getAudioElement,
} from "./utilities/audio-analyser";
import getCommonUniforms, {
  initCommonUniforms,
  updateCommonUniforms,
  setResolutionUniform,
} from "./utilities/common-uniforms";

import "./style.css";

const debugValues = {
  disableAudio: false,
  isAnalyzerMeshVisible: false,
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
initCommonUniforms();

function initSoundConnectedGeometry() {
  /**
   * Textures
   */

  /**
   * Test mesh
   */
  // Geometry

  const geometry = new THREE.PlaneBufferGeometry(2, 2);

  // Material
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...getCommonUniforms(),
      ...getAnalyserUniformData(),
    },
    vertexShader: planeVertexShader,
    fragmentShader: planeFragmentShader,
  });

  // Mesh
  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const analyserMesh = createAnalyserMesh({ scene });
  scene.add(analyserMesh);
}

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const helpersGui = getGui().addFolder("Visualization helpers");
helpersGui.add(debugValues, "showAxesHelper").name("Show axes helper");
helpersGui.add(debugValues, "isAnalyzerMeshVisible").name("Show analyzer data");

/**
 * Sizes
 */
let sizes = {
  width: canvas.width,
  height: canvas.height,
};

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

function setSizes() {
  // Update sizes
  sizes = getSizes();

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  setResolutionUniform({ width: canvas.width, height: canvas.height });
}

window.addEventListener("resize", () => {
  setSizes();
});

setSizes();

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  updateCommonUniforms();
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

  initSoundConnectedGeometry();

  tick();
} else {
  const startButton = document.getElementById("startButton");
  startButton.addEventListener("click", onStartButtonClick);

  function onStartButtonClick() {
    const waitForAudioReadyInterval = setInterval(() => {
      if (getAudioElement().readyState == 4) {
        clearInterval(waitForAudioReadyInterval);

        initSound({ scene, renderer });
        initSoundConnectedGeometry();

        const overlay = document.getElementById("overlay");
        overlay.remove();

        tick();
      }
    }, 100);

    startButton.innerHTML = "Loading...";
  }
}
