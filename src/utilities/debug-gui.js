import * as dat from "lil-gui";

let gui;

export default function getGui() {
  if (!gui) {
    gui = new dat.GUI();
  }

  return gui;
}
