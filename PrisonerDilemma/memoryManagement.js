const v8 = require('v8'); //require to take heapdump

const {
    RUNMEMMNGCODE
  } = require('./config.js');

// Initialize variables to track if snapshots have been taken
let heapDump100MB = false;
let heapDump200MB = false;


function analyseGlobalScope (prefix, trueFalse) {
    if (trueFalse) {
        for (let i in global) {
            let size = sizeof(global[i]);
            console.log(`${prefix} Global variable: ${i}, estimated size: ${size} bytes`);
        }
    }
}

function estimateFunctionSize(func) {
    // Function size estimation logic here
    // This is a very rough estimate, as the true size of a function in memory is not directly accessible
    const functionAsString = func.toString();
    return functionAsString.length * 2; // Rough estimate based on string length
}

function sizeof(object, seen = new WeakSet()) {
    if (object === null || typeof object !== 'object') {
        return 0;
    }

    if (seen.has(object)) {
        // This object has already been visited, skip it to avoid infinite recursion
        return 0;
    }
    seen.add(object);

    let bytes = 0;
    const objectType = Object.prototype.toString.call(object);

    switch (objectType) {
        case '[object Boolean]':
            bytes += 4;
            break;
        case '[object Number]':
            bytes += 8;
            break;
        case '[object String]':
            bytes += 2 * object.length;
            break;
        case '[object Function]':
            bytes += estimateFunctionSize(object);
            break;
        case '[object Object]':
        case '[object Array]':
            for (const key in object) {
                if (object.hasOwnProperty(key)) {
                    bytes += 2 * key.length;
                    bytes += sizeof(object[key], seen);
                }
            }
            break;        // Add more cases as needed for other types
    }
    return bytes;
}


function takeHeapDump (heapUsedMB, trueFalse) {
    // Create a heap dump at 100 MB
    if (trueFalse && heapUsedMB >= 100 && !heapDump100MB) {
        heapDump100MB = true;
        v8.writeHeapSnapshot('./log/heapdump-100MB.heapsnapshot');
        console.log(`[takeHeapDump] Heap dump created at 100 MB`);
    }

    // Create a heap dump at 200 MB
    if (trueFalse && heapUsedMB >= 200 && !heapDump200MB) {
        heapDump200MB = true;
        v8.writeHeapSnapshot('./log/heapdump-200MB.heapsnapshot');
        console.log(`[takeHeapDump] Heap dump created at 200 MB`);
    }
}

function tfMemLog (tf, prefix, trueFalse) {

    if (RUNMEMMNGCODE && trueFalse) {
        const { numTensors, numDataBuffers, numBytes } = tf.memory();
        oneLine = `Tensors: ${numTensors}, Data Buffers: ${numDataBuffers}, Bytes: ${numBytes}`;
        console.log(`${prefix} ${oneLine}`);
    }
}

function logTensor (tensor, caller, name, trueFalse) {

    if (RUNMEMMNGCODE && trueFalse) {   
        prefix = `[${caller}] [${name}]`;
        console.log(`${prefix} tensor.shape: ${tensor.shape}`);  // Outputs [4], indicating it's a 1D tensor with 4 elements
        console.log(`${prefix} tensor.size: ${tensor.size}`);   // Outputs the size, e.g., 4
        console.log(`${prefix} tensor.dtype: ${tensor.dtype}`);  // Outputs the data type, e.g., 'float32'
        //console.log(tensor.dataSync());  // Outputs the tensor data synchronously, e.g., Float32Array [1, 2, 3, 4]
        tensor.data().then(data => console.log(`${prefix}: ${data}`));  // Outputs the tensor data asynchronously
    }
}

function logMemory (tf, caller, when, decisionCount, cadence, epsilon, trueFalse) {

    //log if trueFalse is true every cadance decisionCount (e.g. every 1,000 decisions)

    //console.log (`DEBUG ${trueFalse} ${decisionCount} ${cadence}`)

    if (RUNMEMMNGCODE && trueFalse && decisionCount % cadence === 0) {
        const prefix = `[${caller}] ${when} ${decisionCount} epsilon ${epsilon}`;
        const heapUsedMB = heapSizeInMB();
        console.log(`${prefix} Memory usage: ${heapUsedMB} MB`);
        tfMemLog (tf, prefix, true); //false doesn't execute
        takeHeapDump (heapUsedMB, false); //false doesn't execute
        analyseGlobalScope (prefix, false); //false doesn't execute
    }

}

function heapSizeInMB () {
    
    if (RUNMEMMNGCODE) {
        const heapUsedBytes = process.memoryUsage().heapUsed;
        const heapUsedMB = Math.round(heapUsedBytes / 1024 / 1024);
        return heapUsedMB;
    }
    else {
        return 0;
    }

}

module.exports = {
    logTensor,
    logMemory,
    heapSizeInMB,
    tfMemLog
  };
