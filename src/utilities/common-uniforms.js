import * as THREE from "three";

const clock = new THREE.Clock();
const canvas = document.querySelector("canvas.webgl");

const commonUniforms = {
  uTime: { type: "f", value: 1.0 },
  uResolution: { type: "v2", value: new THREE.Vector2() },
  uMouse: { type: "v2", value: new THREE.Vector2() },
};

function onMouseMove(e) {
  var rect = e.target.getBoundingClientRect();
  var x = e.clientX - rect.left; //x position within the element.
  var y = e.clientY - rect.top; //y position within the element.

  commonUniforms.uMouse.value.x = x / e.target.clientWidth;
  commonUniforms.uMouse.value.y = 1 - y / e.target.clientHeight;

  // console.log(
  //   "mouse:",
  //   commonUniforms.uMouse.value.x,
  //   commonUniforms.uMouse.value.y
  // );
}

function onWindowResize(event) {
  //   commonUniforms.uResolution.value.x = renderer.domElement.width;
  //   commonUniforms.uResolution.value.y = renderer.domElement.height;
}

export function initCommonUniforms() {
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("windowresize", onWindowResize);
}

export function setResolutionUniform({ width, height }) {
  commonUniforms.uResolution.value = new THREE.Vector2(width, height);
}

export function getMousePos() {
  return { x: commonUniforms.uMouse.value.x, y: commonUniforms.uMouse.value.y };
}

export default function getCommonUniforms() {
  return commonUniforms;
}

export function updateCommonUniforms() {
  const elapsedTime = clock.getElapsedTime();

  // Update material
  commonUniforms.uTime.value = elapsedTime;
}
