import * as THREE from "three";

import getGui from "./debug-gui";
import vertexShader from "../shaders/analyzer-mesh/vertex.glsl";
import fragmentShader from "../shaders/analyzer-mesh/fragment.glsl";

const SOUND_FILE_PATH = "./sounds/first-song_003.mp3";

const FFT_BAND_COUNT = 512 * 2 * 2;
const FFT_SIZE = FFT_BAND_COUNT * 2;
const BAND_RANGES = [175, 350, 800, 1800, 22000];
const BAND_COUNT = BAND_RANGES.length;

let analyser, analyserUniforms, analyserMesh;
const frequencyBands = [];
const heighestAmplitudePerBand = [];
const normalizedFrequencyBands = new Uint8Array(BAND_COUNT);

const rawFrequencyBands = new Uint8Array(FFT_BAND_COUNT);
const normalizedRawFrequencyBands = new Uint8Array(FFT_BAND_COUNT);
const heighestAmplitudePerRawFrequencyBand = [];

let heighestTotalPower = 0;
let normalizedTotalPower = 0;

const mediaElement = new Audio(SOUND_FILE_PATH);

const gui = getGui();
const debugValues = {
  averageFactor: 0.5,
};

const averageFactorController = gui
  .add(debugValues, "averageFactor")
  .min(0)
  .max(1)
  .step(0.001)
  .name("averageFactor");

for (let i = 0; i < BAND_COUNT; i++) {
  frequencyBands[i] = 0;
  normalizedFrequencyBands[i] = 0;
  heighestAmplitudePerBand[i] = 0;
}

function getBucketCountsPerBand() {
  let totalSampleRange = 22000;
  let bucketCountPerBand = [];
  let samplesPerBucket = totalSampleRange / (FFT_SIZE / 2);

  let currBand = 0;
  let currBucketCountPerBand = 0;
  let totalSampleCount = 0;
  while (currBand < BAND_COUNT) {
    currBucketCountPerBand += 1;
    totalSampleCount += samplesPerBucket;

    if (totalSampleCount > BAND_RANGES[currBand]) {
      if (totalSampleCount > totalSampleRange) {
        const overcountDifference = totalSampleCount - totalSampleRange;
        totalSampleCount -= overcountDifference;
      }

      if (currBand === BAND_COUNT - 1) {
        currBucketCountPerBand -= 1;
      }

      bucketCountPerBand[currBand] = currBucketCountPerBand;
      currBucketCountPerBand = 0;
      currBand++;
    }
  }

  return bucketCountPerBand;
}

export function initSound({ renderer, scene }) {
  const listener = new THREE.AudioListener();
  const audio = new THREE.Audio(listener);

  mediaElement.play();

  audio.setMediaElementSource(mediaElement);

  analyser = new THREE.AudioAnalyser(audio, FFT_SIZE);
  const format = renderer.capabilities.isWebGL2
    ? THREE.RedFormat
    : THREE.LuminanceFormat;

  analyserUniforms = {
    uAudioData: {
      value: new THREE.DataTexture(
        normalizedFrequencyBands,
        BAND_COUNT,
        1,
        format
      ),
    },
    uRawFrequencyData: {
      value: new THREE.DataTexture(
        normalizedRawFrequencyBands,
        FFT_BAND_COUNT,
        1,
        format
      ),
    },
    uTotalPower: {
      value: normalizedTotalPower,
    },
    uBandCount: { value: BAND_COUNT },
  };
}

export function createAnalyserMesh() {
  const analyserGeometry = new THREE.PlaneGeometry(1, 1);
  const analyserMaterial = new THREE.ShaderMaterial({
    uniforms: analyserUniforms,
    vertexShader,
    fragmentShader,
  });

  analyserMesh = new THREE.Mesh(analyserGeometry, analyserMaterial);

  return analyserMesh;
}

export function setAverageFactor(averageFactor) {
  averageFactorController.setValue(averageFactor);
}

export function setAnalyserMeshVisibility(isAnalyserMeshVisible) {
  if (!analyserMesh) return;
  analyserMesh.visible = isAnalyserMeshVisible;
}

export function updateCustomFrequencyBandData() {
  if (!analyser) return;

  const averageFactor = debugValues.averageFactor;
  const frequencyData = analyser.getFrequencyData();
  const nextFrequencyBands = [];
  const bucketCountPerBand = getBucketCountsPerBand();

  let totalPowerSum = 0;
  // get raw frequency data
  // console.log("frequencyData.length", frequencyData.length);
  for (let i = 0; i < frequencyData.length - 2; i++) {
    // rawFrequencyBands[i] = frequencyData[i];
    // totalPowerSum += rawFrequencyBands[i];

    rawFrequencyBands[i] =
      (rawFrequencyBands[i] * averageFactor +
        (1 - averageFactor) * frequencyData[i]) /
      2.0;
    totalPowerSum += rawFrequencyBands[i];

    // console.log("totalPowerSum", totalPowerSum);
    // if (isNaN(totalPowerSum)) {
    //   console.log("i", i, frequencyData[i], rawFrequencyBands[i]);
    // }

    // keep track of highest amplitude per band
    if (rawFrequencyBands[i] > (heighestAmplitudePerRawFrequencyBand[i] || 0)) {
      heighestAmplitudePerRawFrequencyBand[i] = rawFrequencyBands[i];
    }
    // use heighestAmplitudePerBand value to normalize results between 0-100
    normalizedRawFrequencyBands[i] =
      (rawFrequencyBands[i] / heighestAmplitudePerRawFrequencyBand[i]) * 100;
  }

  // get total power normalized
  if (totalPowerSum > heighestTotalPower) {
    heighestTotalPower = totalPowerSum;
  }
  // console.log("totalPowerSum", totalPowerSum);
  normalizedTotalPower = totalPowerSum / heighestTotalPower;

  // get power per dedicated band group
  let count = 0;
  for (let i = 0; i < BAND_COUNT; i++) {
    // get number of FFT buckets to collect for this band
    let sum = 0;
    let sampleCount = bucketCountPerBand[i];

    // collect sum of amplitudes over sample size and then average
    for (let j = 0; j < sampleCount; j++) {
      sum += frequencyData[count];
      count++;
    }

    const average = sum / sampleCount;
    nextFrequencyBands[i] = average;

    // average new frequency band data with previous data for smoother results
    frequencyBands[i] =
      (frequencyBands[i] * averageFactor +
        (1 - averageFactor) * nextFrequencyBands[i]) /
      2.0;

    // keep track of highest amplitude per band
    if (frequencyBands[i] > heighestAmplitudePerBand[i]) {
      heighestAmplitudePerBand[i] = frequencyBands[i];
    }
    // use heighestAmplitudePerBand value to normalize results between 0-100
    normalizedFrequencyBands[i] =
      (frequencyBands[i] / heighestAmplitudePerBand[i]) * 100;

    analyserUniforms.uAudioData.value.needsUpdate = true;
    analyserUniforms.uRawFrequencyData.value.needsUpdate = true;
    analyserUniforms.uTotalPower.value = normalizedTotalPower;

    // console.log("analyserUniforms", analyserUniforms);
  }
}

export function getAnalyserUniformData() {
  return analyserUniforms;
}

export function getAudioElement() {
  return mediaElement;
}

export function setAudioCurrentTime(currentTime) {
  if (mediaElement) {
    // mediaElement.currentTime = currentTime;
  }
}
