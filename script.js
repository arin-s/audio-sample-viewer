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

  async populateDeviceList() {
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
    this.pcmWorker.port.onmessage = (message) => {
      this.audioBuffer = message.data;
    };
    this.audioContext.resume();
  }
}


main();

async function main() {
  let audioManager = new AudioManager();
  await audioManager.getAudioPerms();
  await audioManager.setupDeviceList();
  
}



//canvas
let canvas = document.getElementById("amplitude").getContext("2d");
canvas.fillStyle = "red";
async function showData(event) {
  canvas.clearRect(0, 0, 10, 100);
  console.log(await event.data.text());
}

/*
async function getAudioTrack(device) {
  tracks = device.getTracks();
  if (tracks.length == 0) {
    throw new Error("No audio tracks available");
  }
  console.log(tracks.length);
  return tracks[0];
}
*/