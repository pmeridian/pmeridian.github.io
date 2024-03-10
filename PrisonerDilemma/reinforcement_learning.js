// mlStrategy.js
//const tf = require('@tensorflow/tfjs');
const tf = require('@tensorflow/tfjs-node'); //back-end version of tensorflow
//import * as tf from '@tensorflow/tfjs';
//import * as tf from '@tensorflow/tfjs-node';

//import os from 'os';
const os = require('os');

// // Strategies for ML 
// const COOPERATEML = 0;
// const DEFECTML = 1;

// LSTM (Long Short-Term Memory) Layers:
// In most practical applications of the iterative prisoner's dilemma, 
// especially if you're considering strategies that depend on the history of moves, 
// an LSTM-based approach would likely be more adept. This allows the model to learn and 
// make decisions based on the pattern of previous interactions, which is a key element of 
// most successful strategies in the prisoner's dilemma game.
//
// NOTE!!! I WANT TO TRY TO START SIMPLE WITH A DENSE LAYERS APPROACH
//

const {
    COOPERATE,
    DEFECT,
    COOPERATEML,
    DEFECTML
  } = require('./config.js');

const {
    logTensor,
    logMemory,
    heapSizeInMB,
    tfMemLog
    } = require('./memoryManagement.js');

async function initializeMLStrategy() {

    try {
        let mlStrategy = await MLStrategy.create();
        // Now you can use mlStrategy instance
        // ... rest of your code ...
        return mlStrategy;
    } catch (error) {
        console.error("Failed to create MLStrategy instance:", error);
        return null;
    }
}

class MLStrategy {
    constructor(mlMemoryLength, numberOfInputNodes, numberOfOutputNodes, numberOfHiddenNeurons, discountFactor) {

        this.possibleActions = [COOPERATE, DEFECT];

        this.mlMemoryLength = mlMemoryLength;
        this.numberOfInputNodes = numberOfInputNodes; // Last X rounds × 2 players
        this.numberOfOutputNodes = numberOfOutputNodes;
        this.numberOfHiddenNeurons = numberOfHiddenNeurons;
        this.model = null;
        this.discountFactor = discountFactor; 
        this.isTraining = false; // Flag to indicate if training is in progress
        this.epsilon = 0;
        this.epsilonCount = 0;
        this.totalTimeForLast1000Decisions = 0;
        this.countDecisionsCoop = 0;

    }
    
    static async create() {

        const mlMemoryLength = 5; //how many previous decisions we pass to the ML for training
        const numberOfInputNodes = 2 * mlMemoryLength; // Last X rounds × 2 players
        const numberOfOutputNodes = 2;  // Cooperate or Defect
        const numberOfHiddenNeurons = 6; // Units are "neurons" for a hidden layer
        // LEARN NOTES
        // Rule of Thumb: A common starting point is to use a number of units that is somewhere 
        // between the size of the input layer and the size of the output layer. 
        // For example, if you have an input layer of size 20 and an output layer of size 2, 
        // you might start with a hidden layer of 10-15 units.
        // Machine learning often involves experimentation. Start with a reasonable guess like 4-5 units,
        // train your model, evaluate its performance, and adjust the number of units based on the results. 
        // If your model is underfitting (performing poorly on training data), you might need more units. 
        // If it’s overfitting (performing well on training data but poorly on unseen data), 
        // reducing the number of units might help.

        const discountFactor = 0.9; // 0.9 is a common choice, can be adjusted based on specific needs
        // The discount factor, usually denoted as γ (gamma), is used to balance immediate and future rewards. 
        // It represents the importance of future rewards compared to immediate ones.
        // Value Range: It ranges between 0 and 1. A value close to 0 makes the agent 
        // short-sighted by only considering immediate rewards, while a value close to 1 makes 
        // the agent far-sighted by valuing future rewards more.

        const model = new MLStrategy(mlMemoryLength, numberOfInputNodes, numberOfOutputNodes, numberOfHiddenNeurons, discountFactor);
        await model.CreateModel();
        return model;
    }

    async CreateModel() {

        // first version
        // this.model = tf.sequential({
        //     layers: [
        //         tf.layers.dense({ units: this.numberOfUnits, inputShape: [this.numberOfInputNodes], activation: 'relu' }),
        //         tf.layers.dense({ units: this.numberOfOutputNodes })
        //     ]
        // });

        // Non-LSTM layers like Dense layers don't work with the concept of timesteps.
        // They just expect [samples, features]. If you were using a Dense layer directly on your data 
        // without an LSTM, your input shape would indeed be [2 * mlMemoryLength] because you're essentially 
        // flattening the sequence of moves into a single array.

        // second version, tweaking learningRates

        // try learningRates = [0.01, 0.001, 0.0001];
        // Set a specific learning rate (normally it is not required)
        //const learningRate = 0.0001; // Example value, you can change this for each run

        // Create an optimizer with the specified learning rate
        //const optimizer = tf.train.adam(learningRate);

        //this.model.compile({ loss: 'meanSquaredError', optimizer: 'adam' });
        //this.model.compile({ loss: 'meanSquaredError', optimizer: optimizer });

        // third version adding a 2nd hidden layer
        // units originally were suggested 64 and 32, I changed it to this.numberOfUnits * 2 and this.numberOfUnits 
        this.model = tf.sequential();
        this.model.add(tf.layers.dense({
            units: this.numberOfHiddenNeurons * 2,  // Number of neurons
            inputShape: [this.numberOfInputNodes], // Input shape
            activation: 'relu',
            biasInitializer: 'zeros' // Weight initializer for bias
        })); // First hidden layer
        //this.model.add(tf.layers.dense({units: this.numberOfHiddenNeurons, activation: 'relu'})); // Second hidden layer
        this.model.add(tf.layers.dense({units: this.numberOfOutputNodes})); // Output layer: 2 units for cooperate (0) and defect (1)
        this.model.compile({ loss: 'meanSquaredError', optimizer: tf.train.adam() });

        // this.model = tf.sequential();
        // this.model.add(tf.layers.dense({units: 64, activation: 'relu', inputShape: [inputShape]}));
        // this.model.add(tf.layers.dense({units: 2, activation: 'softmax'}));
        // this.model.compile({optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy']});


        // try {
        //     // Attempt to load the model

        //     const modelName = 'model-memory-length-${this.mlMemoryLength}';

        //     const modelPath = 'file://./models/${modelName}/model.json';
        //     this.model = await tf.loadLayersModel(modelPath);
        //     console.log("Model loaded successfully.");
        //     // Compile the model after loading
        //     this.model.compile({ loss: 'meanSquaredError', optimizer: 'adam' });
        // } catch (error) {
        //     // If loading fails, create a new model
        //     console.log("Model not found. Creating a new one.");
        //     this.model = tf.sequential({
        //         layers: [
        //             tf.layers.dense({ units: this.numberOfUnits, inputShape: [this.numberOfInputNodes], activation: 'relu' }),
        //             tf.layers.dense({ units: this.numberOfOutputNodes })
        //         ]
        //     });
        //     this.model.compile({ loss: 'meanSquaredError', optimizer: 'adam' });
        // }
    }


    async saveModel(model) {
        const modelName = 'model-memory-length-${this.mlMemoryLength}';
        const savePath = 'file://./models/${modelName}';
    
        await model.save(savePath);
        console.log(`Model saved to ${savePath}`);
    }

    preprocessData (opponentHistory, myHistory, veryVerbose) {
        // Convert rawData into a format suitable for training
        // Normalize data if necessary

        // if (mode === 'strict') { //in this case, I assume it's training and the length is already accurate

        // }

        // Input validation
        if (!Array.isArray(opponentHistory) || !Array.isArray(myHistory)) {
            throw new Error('Invalid input: opponentHistory and myHistory must be arrays.');
        }

        // if (opponentHistory.length === 0 && myHistory.length === 0) {
        //     let resetStatePattern;
        //     if (this.denseLayers) {
        //         // resetStatePattern for dense (with inputShape: [this.numberOfInputNodes])
        //         resetStatePattern = Array(this.numberOfInputNodes).fill(-1); // Reset state pattern
        //     }
        //     if (this.lstmLayers) {
        //         // resetStatePattern for LSTM (with inputShape: [this.mlMemoryLength, 2])
        //         resetStatePattern = Array(this.mlMemoryLength).fill([-1, -1]); // Using [-1, -1] for each timestep
        //     }
        //     console.log ('[preprocessData] new game - sending resetStatePattern: ${JSON.stringify(resetStatePattern)}');
        //     return resetStatePattern; //send reset pattern to the model when new game starts
        // }

        // const isMyHistoryFirst = true;
        // const mostRecentMoveFirst = true;

        // console.log ('[preprocessData] before trim myHistory: ${myHistory.length} opponentHistory: ${opponentHistory.length}')

        const myHistoryRightLength = this.trimAndPadHistory (myHistory);
        const opponentHistoryRightLength = this.trimAndPadHistory (opponentHistory);

        // console.log ('[preprocessData] after trim myHistory: ${myHistoryRightLength.length} opponentHistory: ${opponentHistoryRightLength.length}')

        // Check lengths of trimmed and padded histories
        if (myHistoryRightLength.length !== this.mlMemoryLength || opponentHistoryRightLength.length !== this.mlMemoryLength) {
            throw new Error(`Error in history lengths: myHistory is ${myHistoryRightLength.length}, opponentHistory is ${opponentHistoryRightLength.length}`);
        }

        let mappedFeatures;
        // Create alternating array
        let features = [];

        // we simply concatenate myHistory and opponentHistory
        features = features.concat(myHistoryRightLength, opponentHistoryRightLength);

        // for (let i = 0; i < this.mlMemoryLength; i++) {
        //     const index = mostRecentMoveFirst ? this.mlMemoryLength - 1 - i : i;
            
        //     if (isMyHistoryFirst) {
        //         features.push(myHistoryRightLength[index], opponentHistoryRightLength[index]);
        //     } else {
        //         features.push(opponentHistoryRightLength[index], myHistoryRightLength[index]);
        //     }
        // }

        // Map COOPERATE to COOPERATEML and DEFECT to DEFECTML
        mappedFeatures = features.map(feature => {
            if (feature === COOPERATE) {
                return COOPERATEML;
            } else if (feature === DEFECT) {
                return DEFECTML;
            } else {
                throw new Error('Invalid feature value: ' + feature);
            }
        })

        // Check final array length
        if (mappedFeatures.length !== this.numberOfInputNodes) {
            throw new Error(`Error: Expected features array of length ${this.numberOfInputNodes}, but got ${mappedFeatures.length}`);
        }

        const howMuchToPrint = 10;
        if (veryVerbose) {
            console.log (`[preprocessData] myHistory: ${myHistory.slice(-howMuchToPrint).join("")} opponentHistory: ${opponentHistory.slice(-howMuchToPrint).join("")} mappedFeatures: ${JSON.stringify(mappedFeatures)} `)
        }

        return mappedFeatures;
        
    }

    trimAndPadHistory(history) {

        // Set the desired length and padding value internally
        const desiredLength = this.mlMemoryLength;
        const padValue = COOPERATE;

        // Pad history if it's shorter than the desired length
        const paddingLength = Math.max(desiredLength - history.length, 0);

        const paddedHistory = Array(paddingLength).fill(padValue).concat(history);


        // Trim the history to the desired length
        const historyTrimmedAndPadded = paddedHistory
            .slice(-desiredLength) // Ensure the history is not longer than desired length
        
        return historyTrimmedAndPadded;
    }

    async makeDecision(opponentHistory, myHistory, decisionCount, exploreFlag, veryVerbose) {

        const initialEpsilon = 1.0;  // Start with 100% exploration
        const minEpsilon = 0.01; // Minimum value of epsilon (% of exploration)

        if (myHistory.length === 0) {
            this.epsilon = initialEpsilon
            if (veryVerbose) {
                console.log (`[makeDecision] myHistory empty - start new game - exploreFlag: ${exploreFlag} epsilon: ${this.epsilon}`);
            }
            // start of a new game
            this.epsilonCount = 0;
            this.countDecisionsCoop = 0;
            //mlStrategy = await MLStrategy.create();

        }

        const howOftenToLog = 10;

        //console.log ('[makeDecision] decisionCount: ${decisionCount} epsilon: ${epsilon}')

        logMemory (tf, 'makeDecision', 'before decision', decisionCount, 1000, this.epsilon, false) //false disable logging

        // you can introduce randomness in the agent’s actions during the training phase to encourage exploration. 
        // This is a common practice in reinforcement learning known as epsilon-greedy strategy.

        // In the epsilon-greedy strategy, the agent will mostly take the action that it believes
        // is the best according to its current knowledge (exploitation), but with a probability of epsilon, 
        // it will take a random action (exploration). This allows the agent to learn about the consequences 
        // of different actions in various states.

        // this was the original exploration code, but I want to try a different approach:
        // calculate the prediction first and then if we randomly decide to explore, 
        // we return the opposite. This sounds a lot more like real exploration.
        // we will still not "start a fight" - that logic won't change
        // Exploration: with a probability of epsilon, take a random action
        // if (exploreFlag && Math.random() < epsilon) {
        //     if (opponentHistory.length === 0 || !opponentHistory.includes('D')) {
        //         if (veryVerbose) {
        //             console.log(`No reason to attack first - random action: C`);
        //         }
        //         return ('C');
        //     } else {
        //         // Update epsilon
        //         if (epsilon > minEpsilon) {
        //             epsilon = Math.max(minEpsilon, epsilon / 2);
        //         }
        //         const nextAction = Math.random() < 0.5 ? 'C' : 'D';
        //         console.log(`epsilon: ${epsilon} random action: ${nextAction}`);
        //         return (nextAction);
        //     }
        // }

        const startTime = Date.now(); // Start time measurement

        const stateReadyForML = this.preprocessData(opponentHistory, myHistory, veryVerbose);

        // NOTE!!!! I TRY TO SWITCH TO A TRY / CATCH approach and instead of having 
        // on avg 20 tensors at any given time, I ended up with thousands, so I went back to tf.tidy approach
        // but the issue (ever growing numBytes) appears with both tidy and try / catch approach
        // update: I found the bug!!! the issue was I was keeping size on input in check in processTrainingQueue
        // but not in TrainModel so the size of each training set kept growing and growing
        // now numBytes is always small but the heap keeps growing anyway - keep digging!
        const prediction = tf.tidy( () => {

            // Exploitation: otherwise, take the action that the model predicts to be the best

            // Make a decision based on the current model
            // If bothHistoriesConcatReadyForML is a single input instance (i.e., a flat array representing one sequence of moves), 
            // you should wrap it in an additional array [] to create a batch with one instance.

            let inputTensor;
            inputTensor = tf.tensor2d([stateReadyForML]); 

            logTensor (inputTensor, 'makeDecision', 'inputTensor', false); //false disable logging
            // registerTensor(inputTensor, 'inputTensor');
        
            // Check tensor shape based on model architecture
            if (inputTensor.shape[0] !== 1 || inputTensor.shape[1] !== this.numberOfInputNodes) {
                throw new Error(`[Dense Layers] Unexpected tensor shape. Expected [1,${this.numberOfInputNodes}], received ${inputTensor.shape}`);
            }

            // Perform the prediction
            const rawPrediction = this.model.predict(inputTensor);

            if (veryVerbose) {
                console.log(`[makeDecision] rawPrediction: ${JSON.stringify(rawPrediction)}`);
                // console.log(`[makeDecision] rawPrediction: ${rawPrediction.argMax(1)}`);
            }

            logMemory (tf, 'makeDecision', 'inside try', decisionCount, 1000, true) //false disable logging


            return rawPrediction.argMax(1);

        });

        // Extract the data from the tensor
        const decision = await prediction.dataSync()[0];

        if (veryVerbose) {
            console.log(`[makeDecision] expected decision: ${decision}`);
        }

        // Dispose of the prediction tensor if not already handled by tf.tidy
        if (prediction instanceof tf.Tensor) {
            // unregisterTensor(inputTensor);
            prediction.dispose();
        }

        // Measure the time taken for this decision
        const timeTaken = Date.now() - startTime;

        // Keep track of the total time taken for the last 1000 decisions
        this.totalTimeForLast1000Decisions = (this.totalTimeForLast1000Decisions || 0) + timeTaken;

        // if (this.totalTimeForLast1000Decisions > 0) {
        //     console.log ('this.totalTimeForLast1000Decisions: ${this.totalTimeForLast1000Decisions}')
        // }

        logMemory (tf, 'makeDecision', 'after decision', decisionCount, 1000, true) //false disable logging

        // Reset the count and totalp time every howOftenToLog decisions and report average
        if (veryVerbose && decisionCount % howOftenToLog === 0) {
            // Calculate average time with two decimal places
            const avgTimePerDecision = parseFloat((this.totalTimeForLast1000Decisions / howOftenToLog).toFixed(2));
            console.log(`[makeDecision] Average time per decision (last ${howOftenToLog}): ${avgTimePerDecision} ms`);
            this.totalTimeForLast1000Decisions = 0; // Reset for the next decisions
        }

        if (exploreFlag && decision === COOPERATEML) {
            // we check exploreFlag to avoid counting twice when 
            // machineLearningOne vs machineLearningOne
            this.countDecisionsCoop++;
        }

        //if (decisionCount % howOftenToLog === 0 || decision === 1) {
        if (veryVerbose && decisionCount % howOftenToLog === 0) {
        //if (decision === 1) {
            const howMuchToPrint = 20;
            console.log(`[makeDecision] decisionCount: ${decisionCount} ML history: ${myHistory.slice(-howMuchToPrint).join("")} opponent history: ${opponentHistory.slice(-howMuchToPrint).join("")} decision predicted: ${decision}`);
            console.log(`[makeDecision] decisionCount: ${decisionCount} stateReadyForML: ${stateReadyForML} decision: ${decision}`);
            console.log(`[makeDecision] decisionCount: ${decisionCount} rate of cooperation: ${Math.round((this.countDecisionsCoop / decisionCount)*100)}%`);    
        }

        let nextAction;

        if (decision === DEFECTML) {
            // console.log(`[makeDecision] rawPrediction is D!`);
            nextAction = DEFECT;
        }
        else {
            nextAction = COOPERATE;
        }

        // console.log(`opponentHistory.length: ${opponentHistory.length}`);
        // if (opponentHistory.length > 0) {
        //     console.log(`opponentHistory.includes(DEFECT): ${opponentHistory.includes(DEFECT)}`);
        // }


        // if opponent has used 'D' at least once, we can contemplate exploration
        if (opponentHistory.length > 0 && opponentHistory.includes(DEFECT)) {
            if (veryVerbose) {
                console.log(`we could explore - epsilon: ${this.epsilon}`);
            }
            if (exploreFlag && Math.random() < this.epsilon) {
                // so we know we have the "license" to explore, and we randomly decided to explore
                // so we will return the opposite value to the prediction
                if (nextAction === COOPERATE) {
                    nextAction = DEFECT
                }
                else {
                    nextAction = COOPERATE
                }
                if (veryVerbose) {
                    console.log(`epsilon: ${this.epsilon} random action: ${nextAction}`);
                }
                // Update epsilon
                if (this.epsilon > minEpsilon) {
                    this.epsilon = Math.max(minEpsilon, this.epsilon / 2);
                }
            }
        }

        return nextAction;

        // For now, return a random decision
        // Assuming 0 for Cooperate, 1 for Defect
        // return Math.floor(Math.random() * 2);
    }

    //async trainModel(data) {

    translateToML(moveEnglish) {

        let result;

        if (moveEnglish === COOPERATE) {
            result = COOPERATEML;
        } else if (moveEnglish === DEFECT) {
            result = DEFECTML;
        } else {
            throw new Error(`Invalid input: ${lastMove}. Expected either ${COOPERATE} or ${DEFECT}.`);
        }
        //console.log ('translateToML input ${moveEnglish} output ${result}');
        return result;
    }


    mapFromMLToText(history) {
        // Input validation
        if (!Array.isArray(history)) {
            throw new Error(`[mapFromMLToText] Invalid input: history must be an array.`);
        }
    
        const is2DArray = Array.isArray(history[0]);
    
        if (is2DArray) {
            // Handling 2D arrays: [this.mlMemoryLength, 2]
            return history.map(subArray => 
                subArray.map(value => this.mapValueToText(value))
            );
        } else {
            // Handling 1D arrays: [this.numberOfInputNodes]
            return history.map(value => this.mapValueToText(value));
        }
    }
    
    mapValueToText(value) {
        if (value === 0) return 'C';
        else if (value === 1) return 'D';
        else if (value === -1) return 'R';
        else return 'Unknown'; // Handling unexpected values
    }

    mapScoreToML (myMove, opponentMove) {
        // to help train the ML, we remap the results of the game
        // when the game gives zero point, this has to be mapped as a negative event
        // to help train the model correctly

        if (myMove === COOPERATE && opponentMove === COOPERATE) {
            return 1
        }
        else if (myMove === COOPERATE && opponentMove === DEFECT) {
            return -1
        }
        else if (myMove === DEFECT && opponentMove === COOPERATE) {
            return 2
        }
        else {
            return 0 // both DEFECT
        }

    }

    async trainModel(myHistory, opponentHistory, myCurrentMove, opponentCurrentMove, veryVerbose) {
        // using Deep Q-Network (DQN) approach in the context of Iterative Prisoner Dilemma

        //console.log(`[trainModel] ${opponentHistory.slice(-this.mlMemoryLength)} ${myHistory.slice(-this.mlMemoryLength)} ${myScoreThisRound} ${myLastMove} ${opponentLastMove}`);

        const myCurrentMoveML = this.translateToML (myCurrentMove)

        const opponentCurrentMoveML = this.translateToML (opponentCurrentMove)

        //console.log(`[trainModel] ${opponentHistory} ${myHistory} ${myScoreThisRound} ${myLastMoveML} ${opponentLastMoveML}`);

        if (this.isTraining) {
            // If the model is already being trained, skip this call or handle it appropriately
            // (SO MUCH EASIER APPROACH than building a queue and keeping track!!!!)
            console.log(`[trainModel] Model Training is already in progress. Skipping this call.`);
            return;
        }

        // console.log(`[trainModel] Training starts. Switching flag to true.`);

        this.isTraining = true; // Set the flag to indicate training is in progress

        
        const thisStateReadyForML = this.preprocessData(opponentHistory, myHistory, veryVerbose);
        //const nextStateReadyForML = this.preprocessData([opponentCurrentMove].concat(opponentHistory), [myCurrentMove].concat(myHistory));
        const nextStateReadyForML = this.preprocessData(opponentHistory.concat(opponentCurrentMove), myHistory.concat(myCurrentMove), veryVerbose);

        if (veryVerbose) {
            console.log (`[trainModel] thisStateReadyForML: ${JSON.stringify(thisStateReadyForML)}`);
            console.log (`[trainModel] thisStateReadyForML (mapFromMLToText): ${this.mapFromMLToText(thisStateReadyForML)}`);
            console.log (`[trainModel] nextStateReadyForML: ${JSON.stringify(nextStateReadyForML)}`);
            console.log (`[trainModel] nextStateReadyForML (mapFromMLToText): ${this.mapFromMLToText(nextStateReadyForML)}`);
        }
            
        let currentQs;
        let nextMaxQ;

        // curentQs is an array of two values (the Q-values for the two actions: 'C' and 'D')
        currentQs = this.model.predict(tf.tensor2d([thisStateReadyForML])).dataSync(); //3d for LSTM 2d for dense
        // we predict the Q-values for a future state and then extract the maximum Q-value,
        // which represents the best estimated reward for the optimal action in that future state. 
        nextMaxQ = tf.max(this.model.predict(tf.tensor2d([nextStateReadyForML])), 1).dataSync()[0]; //3d for LSTM 2d for dense

        if (veryVerbose) {
            console.log (`[trainModel] thisState: ${this.mapFromMLToText(thisStateReadyForML)} currentQs: ${currentQs} `);
            console.log (`[trainModel] nextState: ${this.mapFromMLToText(nextStateReadyForML)} nextMaxQ: ${nextMaxQ}`);
        }

        let reward = this.mapScoreToML (myCurrentMove, opponentCurrentMove); // Score remapped for ML

        // Initialize targetQ as an array with zeros, the same length as the number of output nodes
        //const targetQ = new Array(this.numberOfOutputNodes).fill(0);
        // Update the Q-value for the action taken
        // const targetQ = currentQs.slice();

        let targetQ;
        // targetQ is an empty array of dimension numberOfOutputNodes filled with zeroes
        targetQ = new Array(this.numberOfOutputNodes).fill(0);
        //if (this.lstmLayers) {targetQ = new Array(this.mlMemoryLength).fill([0, 0]);}
        //if (this.lstmLayers) { targetQ = currentQs.slice();}

        if (targetQ.length !== this.numberOfOutputNodes) {
            throw new Error(`Error: Expected targetQ of length ${this.numberOfOutputNodes}, but got: ${JSON.stringify(targetQ)}`);
        }

        if (veryVerbose) {
            console.log (`[trainModel] targetQ before: ${JSON.stringify(targetQ)}`);
        }

        targetQ[myCurrentMoveML] = reward + this.discountFactor * nextMaxQ;

        if (veryVerbose) {
            console.log (`[trainModel] targetQ after: ${JSON.stringify(targetQ)}`);
        }

        const myHistoryString = myHistory.concat(myCurrentMove).slice(-this.mlMemoryLength).join("");
        const opponentHistoryString = opponentHistory.concat(opponentCurrentMove).slice(-this.mlMemoryLength).join("");

        if (veryVerbose) {
            console.log(`[trainModel] myHistoryString: ${myHistoryString} opponentHistoryString: ${opponentHistoryString}`);
            console.log(`[trainModel] action: ${myCurrentMoveML} reward: ${reward} this.discountFactor: ${this.discountFactor} nextMaxQ: ${nextMaxQ}`);
        }

        //console.log(`[trainModel] thisStateReadyForML: ${JSON.stringify(thisStateReadyForML)}`);

        //console.log(`[trainModel] targetQ: ${JSON.stringify(targetQ)}`);

        //thisStateReadyForML = [0, 1, 0, 1, 0, 1];
        //targetQ = [0.5, 0.8];  // Hypothetical target Q-values

        //console.log(`[trainModel] DEBUG targetQ: ${JSON.stringify(targetQ)}`);

//      const labelTensor = tf.oneHot(tf.tensor1d(combinedLabels, 'int32'), 2);

        let inputTensor;
        inputTensor = tf.tensor2d([thisStateReadyForML]);
        logTensor (inputTensor, 'trainModel', 'inputTensor', false); //false does not log
        
        const labelTensor = tf.tensor2d([targetQ]);
        logTensor (labelTensor, 'trainModel', 'labelTensor', false); //false does not log
    

        // NOTE! Cannot be turned into a tf.tidy model due to the async nature of model.fit
        try {

            await this.model.fit(inputTensor, labelTensor, {
                verbose: false,
                epochs: 1,  
                // Training a Deep Q-Network (DQN) with just 1 epoch per update is actually quite common, 
                // especially in reinforcement learning scenarios where the DQN is updated frequently. 
                //batchSize: 32, // Adjust batch size based on your preference            
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        //console.log(`Epoch ${epoch}: loss = ${logs.loss}`);
                        const prefix = '[trainModel] [onEpochEnd]';
                        const heapUsedMB = heapSizeInMB();
                        if (heapUsedMB > 1000) {
                            console.log(`${prefix} Memory usage: ${heapUsedMB} MB`);
                            tfMemLog (tf, prefix, true); //false doesn't execute
                        }
                    },            
                    // Remember, lower loss doesn’t always mean a better model. 
                    // It’s also important to validate your model on a separate validation set 
                    // to ensure it’s not overfitting to the training data. Overfitting occurs 
                    // when a model learns the training data too well and performs poorly on unseen data.

                    onBatchEnd: (batch, logs) => {
                        const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
                        const totalMem = os.totalmem() / 1024 / 1024;
                        //console.log(`[trainModel] [onBatchEnd] Memory usage ${memUsage / totalMem} ${memUsage} out of ${totalMem}`);
                        if (memUsage / totalMem > 0.05) {
                            console.log(`[trainModel] [onBatchEnd] Memory usage is over 5%, stopping training...`);
                            this.model.stopTraining = true;
                        }
                    }
                    // In TensorFlow.js model.fit() is the method that trains a model for a fixed number
                    // of epochs (iterations on a dataset). This method returns a History object. 
                    // The training can be stopped at any time by setting the model.stopTraining property to true. 
                    // This is a part of the TensorFlow.js API.

                    // When you set this.model.stopTraining = true; inside the onBatchEnd callback, 
                    // it signals the training process to stop at the end of that batch. 
                    // This is useful when you have some condition (like memory usage in your case) that,
                    // when met, should immediately stop the training process.
                }        
            });
        } catch (error) {
            console.error('Error during training:', error);
        } finally {
            // console.log(`[trainModel] Training complete. Switching flag back to false.`);
            this.isTraining = false; // Reset the flag once training is complete
        }
    }

}

module.exports = {
    MLStrategy,  // Export the MLStrategy class
    initializeMLStrategy
};

//module.exports.sendNewTrainingData = sendNewTrainingData;  // Export the function


