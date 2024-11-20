"use strict";


class AudioManager {
  streamMedia;
  pcmWorker;
  sourceNode;
  audioContext;
  audioBuffer;
  constructor() {
    this.streamMedia = null;
    this.audioContext = new AudioContext();
    this.audioContext.audioWorklet.addModule("pcm-worker.js").then(() => {
      this.pcmWorker = new AudioWorkletNode(this.audioContext, "pcm-worker")
    });
  }

  async getAudioPerms() {
    try {
      let streamMedia_ = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamMedia_.getTracks().forEach((track) => { track.stop() });
    }
    catch (err) {
      console.error(err);
    }
  }

  async setupDeviceList() {
    let devices;
    try {
      devices = await navigator.mediaDevices.enumerateDevices();
      if (devices.length == 0)
        throw new Error("No audio devices detected");
    } catch (err) {
      console.error(err);
    }
    const menu = document.getElementById("input-devices");
    devices.forEach((device) => {
      if (device.kind === "audioinput") {
        const item = document.createElement("option");
        item.textContent = device.label + " ID:" + device.deviceId;
        item.value = device.deviceId;
        menu.appendChild(item);
      }
    });
    menu.addEventListener("change", this.newAudioDeviceSelected.bind(this));
  }

  async newAudioDeviceSelected(event) {
    if (this.streamMedia != null) {
      this.streamMedia.getTracks().forEach((track) => { track.stop() });
      this.sourceNode.disconnect();
    }
    this.streamMedia = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: event.target.value } } });
    this.sourceNode = this.audioContext.createMediaStreamSource(this.streamMedia);
    this.sourceNode.connect(this.pcmWorker);
    this.pcmWorker.port.onmessage = updateCanvas;
    this.audioContext.resume();
  }
}

let canvas = document.getElementById("amplitude");
let CANVAS_HEIGHT = canvas.height;
let CANVAS_WIDTH = canvas.width;
let canvasContext = canvas.getContext("2d");
canvasContext.lineWidth = 1;
function updateCanvas(event) {
  canvasContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  canvasContext.beginPath();
  let index = 0;
  canvasContext.moveTo(index, 100);
  event.data.forEach((sample) => {
    canvasContext.lineTo(index, 100 + 100 * sample);
    index++;
  })
  canvasContext.moveTo(index, 100);
  canvasContext.closePath()
  canvasContext.stroke();
}

main();

async function main() {
  let audioManager = new AudioManager();
  await audioManager.getAudioPerms();
  await audioManager.setupDeviceList();
}