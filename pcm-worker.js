class PCMWorker extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        this.port.postMessage(inputs[0][0]);
        return true;
    }
}

registerProcessor("pcm-worker", PCMWorker);