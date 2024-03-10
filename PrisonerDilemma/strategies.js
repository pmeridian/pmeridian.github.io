

//import { prepareHistoryForML} from './index.js';

// // Strategies
// const COOPERATE = 'C';
// const DEFECT = 'D';

// // Strategies for ML 
// const COOPERATEML = 0;
// const DEFECTML = 1;

const { version_webgl } = require('@tensorflow/tfjs');
const {
    COOPERATE,
    DEFECT,
  } = require('./config.js');


// before I tought to categorise strategies but this was abandoned 
const strategyCategories = {
    CO: "Cooperative Strategies: Prioritize cooperation over defection.",
    DE: "Defection Strategies: Favor defection as the dominant strategy.",
    RE: "Retaliatory Strategies: Respond to defection with defection.",
    FO: "Forgiving Strategies: Include mechanisms to return to cooperation even after conflict.",
    AD: "Adaptive Strategies: Adjust behavior based on the history of the game.",
    AL: "Alternating Strategies: Regularly switch between cooperating and defecting.",
    EX: "Exploitative Strategies: Aim to take advantage of more cooperative strategies.",
    RA: "Randomized Strategies: Incorporate randomness into decision-making.",
    ML: "Machine Learning Strategies"
};

// before I tought to categorise strategies but this was abandoned 
const strategyMapping = {
    machineLearningOne: "ML",
    winStayLoseShift: "AD",
    cooperateAlways: "CO",
    random90Cooperation: "CO",
    defectAlways: "DE",
    titForTatTrustful: "RE",
    titForTatSuspicious: "RE",
    _2titForTats: "RE",
    grudger: "RE",
    grudgerRecovery: "RE",
    grudgerRecoveryAlternate: "RE",
    titForTatGenerous30: "FO",
    titForTatGenerous10: "FO",
    titFor2Tats: "FO",
    titFor3Tats: "FO",
    titForTatOppositeCoop: "AD",
    titForTatOppositeDef: "AD",
    titForTatGradual: "AD",
    titForTatImperfect: "AD",
    pavlov: "AD",
    returnAvgLast5: "AD",
    returnAvgAllDef: "AD",
    returnAvgAllCoop: "AD",
    alternateCoop: "AL",
    alternateDef: "AL",
    alternate3and3: "AL",
    provocateur: "EX",
    random50Cooperation: "RA",
    random70Cooperation: "RA",
    random80Cooperation: "RA"
};

// const strategyMapping = {
//     //cooperateAlways: "CO",
//     //random90Cooperation: "CO",
//     //defectAlways: "DE",
//     titForTatTrustful: "RE",
//     titForTatSuspicious: "RE",
//     _2titForTats: "RE",
//     grudger: "RE",
//     titForTatGenerous: "FO",
//     titFor2Tats: "FO",
//     titFor3Tats: "FO",
//     //titForTatOppositeCoop: "AD",
//     //titForTatOppositeDef: "AD",
//     pavlov: "AD",
//     returnAvgLast5: "AD",
//     returnAvgAllDef: "AD",
//     returnAvgAllCoop: "AD",
//     //alternateCoop: "AL",
//     //alternateDef: "AL",
//     //alternate3and3: "AL",
//     provocateur: "EX",
//     random50Cooperation: "RA",
//     random70Cooperation: "RA",
//     random80Cooperation: "RA"
// };


const strategies = {

    machineLearningOne: async (opponentHistory, myHistory, decisionCount, exploreFlag, veryVerbose, mlStrategy) => {

        // console.log (`[machineLearningOne] exploreFlag: ${exploreFlag}`)

        const decision = await mlStrategy.makeDecision(opponentHistory, myHistory, decisionCount, exploreFlag, veryVerbose);

        return decision;
        //console.log(`decision: ${decision}`);
    },

    cooperateAlways: () => COOPERATE,
    defectAlways: () => DEFECT,

    //titForTat: (history) => history.length === 0 ? COOPERATE : history[history.length - 1],

    //grudger: (history) => history.includes(DEFECT) ? DEFECT : COOPERATE,
    
    grudgerRecoveryAlternate: (opponentHistory, myHistory) => {

        if (!opponentHistory || opponentHistory.length === 0) {
            return COOPERATE; // Default to cooperate if history is undefined or empty
        }
        if (myHistory[myHistory.length - 1] === COOPERATE
            && myHistory.includes(DEFECT) ) {
                // const myHistoryPrint = myHistory.map((element) => (element === COOPERATE ? "C" : element === DEFECT ? "D" : element));
                // const opponentHistoryPrint = opponentHistory.map((element) => (element === COOPERATE ? "C" : element === DEFECT ? "D" : element));                        
                // console.log (`myHistory      : ${myHistoryPrint.join("")}`)
                // console.log (`opponentHistory: ${opponentHistoryPrint.join("")}`)

                //we are in a recovery scenario
                // console.log ("we are in a recovery scenario")

                if ((myHistory.length > 2) 
                && myHistory[myHistory.length - 1] === COOPERATE
                && myHistory[myHistory.length - 2] === DEFECT) {
                    //now I must cooperate again since I couldn't see how it replied yet
                    // console.log ("now I must cooperate again since I couldn't see how it replied yet")
                    return COOPERATE;
                }

        
                // if (Math.random() < 0.2) {
                //     //let's try 2 C in a row 
                //     console.log (`let's try 2 C in a row `)
                //     return COOPERATE;
                // }
                const myLastDefectPosition = myHistory.lastIndexOf(DEFECT);
                // console.log (`myLastDefectPosition: ${myLastDefectPosition}`);

                const opponentHistorySinceImGood = opponentHistory.slice(myLastDefectPosition + 2);
                // here I should explain why 2, but you need to see the game log
                // basically, only after my 2nd C in a row I can evaluate what the adversary is doing
                // in response to my attempt to recover

                // const opponentHistorySinceImGoodPrint = opponentHistorySinceImGood.map((element) => (element === COOPERATE ? "C" : element === DEFECT ? "D" : element));
                // console.log (`opponentHistorySinceImGood: ${opponentHistorySinceImGoodPrint.join("")}`)

                return opponentHistorySinceImGood.includes(DEFECT) ? DEFECT : COOPERATE;

            }


        // Generate a random number between 5 (inclusive) and 10 (exclusive)
        const randomNumber = Math.random() * (10 - 3) + 3;
        if (myHistory.length > randomNumber) {
            if ((myHistory.slice(-randomNumber).every((element) => element === DEFECT)) &&
            (opponentHistory.slice(-randomNumber+1).every((element) => element === DEFECT))) {
                // we are in a D//D dealock, let's see if we can break it

                // const myHistoryPrint = myHistory.map((element) => (element === COOPERATE ? "C" : element === DEFECT ? "D" : element));
                // const opponentHistoryPrint = opponentHistory.map((element) => (element === COOPERATE ? "C" : element === DEFECT ? "D" : element));                        
                // console.log (`myHistory      : ${myHistoryPrint.join("")}`)
                // console.log (`opponentHistory: ${opponentHistoryPrint.join("")}`)
        
                // console.log (`we are in a D//D dealock, let's see if we can break it`)
                // console.log (`randomNumber: ${Math.floor(randomNumber)} - myHistory.length: ${myHistory.length}`)
                if (opponentHistory.every((element) => element === DEFECT)){
                    // unless we are facing defectAlways
                    // console.log ("unless we are facing defectAlways")
                    ;
                }
                else {
                    return COOPERATE;
                }
            }
        }
        
        return opponentHistory.includes(DEFECT) ? DEFECT : COOPERATE;
    },

    grudgerRecovery: (opponentHistory, myHistory) => {

        if (!opponentHistory || opponentHistory.length === 0) {
            return COOPERATE; // Default to cooperate if history is undefined or empty
        }
        if (myHistory[myHistory.length - 1] === COOPERATE
            && myHistory.includes(DEFECT) ) {
                // const myHistoryPrint = myHistory.map((element) => (element === COOPERATE ? "C" : element === DEFECT ? "D" : element));
                // const opponentHistoryPrint = opponentHistory.map((element) => (element === COOPERATE ? "C" : element === DEFECT ? "D" : element));                        
                // console.log (`myHistory      : ${myHistoryPrint.join("")}`)
                // console.log (`opponentHistory: ${opponentHistoryPrint.join("")}`)

                //we are in a recovery scenario
                // console.log ("we are in a recovery scenario")

                if ((myHistory.length > 2) 
                && myHistory[myHistory.length - 1] === COOPERATE
                && myHistory[myHistory.length - 2] === DEFECT) {
                    //now I must cooperate again since I couldn't see how it replied yet
                    // console.log ("now I must cooperate again since I couldn't see how it replied yet")
                    return COOPERATE;
                }

        
                // if (Math.random() < 0.2) {
                //     //let's try 2 C in a row 
                //     console.log (`let's try 2 C in a row `)
                //     return COOPERATE;
                // }
                const myLastDefectPosition = myHistory.lastIndexOf(DEFECT);
                // console.log (`myLastDefectPosition: ${myLastDefectPosition}`);

                const opponentHistorySinceImGood = opponentHistory.slice(myLastDefectPosition + 2);
                // here I should explain why 2, but you need to see the game log
                // basically, only after my 2nd C in a row I can evaluate what the adversary is doing
                // const opponentHistorySinceImGoodPrint = opponentHistorySinceImGood.map((element) => (element === COOPERATE ? "C" : element === DEFECT ? "D" : element));
                // console.log (`opponentHistorySinceImGood: ${opponentHistorySinceImGoodPrint.join("")}`)

                return opponentHistorySinceImGood.includes(DEFECT) ? DEFECT : COOPERATE;

            }


        // Generate a random number between 5 (inclusive) and 10 (exclusive)
        const randomNumber = Math.random() * (10 - 5) + 5;
        if (myHistory.length > randomNumber) {
            if ((myHistory.slice(-randomNumber).every((element) => element === DEFECT)) &&
            (opponentHistory.slice(-randomNumber+1).every((element) => element === DEFECT))) {
                // const myHistoryPrint = myHistory.map((element) => (element === COOPERATE ? "C" : element === DEFECT ? "D" : element));
                // const opponentHistoryPrint = opponentHistory.map((element) => (element === COOPERATE ? "C" : element === DEFECT ? "D" : element));                        
                // console.log (`myHistory      : ${myHistoryPrint.join("")}`)
                // console.log (`opponentHistory: ${opponentHistoryPrint.join("")}`)
        
                // we are in a D//D dealock, let's see if we can break it
                // console.log (`we are in a D//D dealock, let's see if we can break it`)
                // console.log (`randomNumber: ${Math.floor(randomNumber)} - myHistory.length: ${myHistory.length}`)
                if (opponentHistory.every((element) => element === DEFECT)){
                    // unless we are facing defectAlways
                    // console.log ("unless we are facing defectAlways")
                    ;
                }
                else {
                    return COOPERATE;
                }
            }
        }
        
        return opponentHistory.includes(DEFECT) ? DEFECT : COOPERATE;
    },

    grudger: (opponentHistory) => {
        if (!opponentHistory || opponentHistory.length === 0) {
            return COOPERATE; // Default to cooperate if history is undefined or empty
        }
        return opponentHistory.includes(DEFECT) ? DEFECT : COOPERATE;
    },

    provocateur: (opponentHistory, myHistory) => {
        // if it cooperated for the last 2 rounds, defect
        if (myHistory.length < 2 || (myHistory[myHistory.length - 1] === COOPERATE && myHistory[myHistory.length - 2] === COOPERATE)) {
            return DEFECT;
        }
        return COOPERATE;
    },

    titForTatOppositeCoop: (opponentHistory) => {
        if (!opponentHistory || opponentHistory.length === 0) {
            return COOPERATE;
        }
        return opponentHistory[opponentHistory.length - 1] === COOPERATE ? DEFECT : COOPERATE;
    },

    titForTatOppositeDef: (opponentHistory) => {
        if (!opponentHistory || opponentHistory.length === 0) {
            return DEFECT;
        }
        return opponentHistory[opponentHistory.length - 1] === COOPERATE ? DEFECT : COOPERATE;
    },

    titForTatTrustful: (opponentHistory) => {
        if (!opponentHistory || opponentHistory.length === 0) {
            return COOPERATE;
        }
        return opponentHistory[opponentHistory.length - 1];
    },

    titForTatSuspicious: (opponentHistory) => {
        // defect on first round, then TitForThat
        if (!opponentHistory || opponentHistory.length === 0) {
            return DEFECT;
        }
        return opponentHistory[opponentHistory.length - 1];
    },

    titForTatGenerous30: (opponentHistory) => {
        if (!opponentHistory || opponentHistory.length === 0) {
            return COOPERATE;
        }
        // Cooperates mostly but sometimes forgives a defection
        return (opponentHistory[opponentHistory.length - 1] === COOPERATE || Math.random() < 0.3) ? COOPERATE : DEFECT;
    },

    titForTatGenerous10: (opponentHistory) => {
        if (!opponentHistory || opponentHistory.length === 0) {
            return COOPERATE;
        }
        // Cooperates mostly but sometimes forgives a defection
        return (opponentHistory[opponentHistory.length - 1] === COOPERATE || Math.random() < 0.1) ? COOPERATE : DEFECT;
    },

    _2titForTats: (opponentHistory) => {
        if (!opponentHistory || opponentHistory.length < 1) {
            return COOPERATE; // Initally cooperate
        }

        if (!opponentHistory || opponentHistory.length === 1) {
            return opponentHistory[opponentHistory.length - 1]; //Then return opponent's move
        }

        // Check if the opponent defected in either of the last two rounds
        if (opponentHistory[opponentHistory.length - 1] === DEFECT || opponentHistory[opponentHistory.length - 2] === DEFECT) {
            return DEFECT; // Retaliate with defection
        }

        return opponentHistory[opponentHistory.length - 1];; // Default, mirror move
    },

    titFor2Tats: (opponentHistory) => {
        if (!opponentHistory || opponentHistory.length < 2) {
            return COOPERATE; // Default to cooperate if history is undefined or has length < 2
        }

        // Check if the opponent defected in the last two rounds
        if (opponentHistory[opponentHistory.length - 1] === DEFECT && opponentHistory[opponentHistory.length - 2] === DEFECT) {
            return DEFECT; // Retaliate with defection
        }

        return COOPERATE; // Otherwise, cooperate
    },

    titFor3Tats: (opponentHistory) => {
        if (!opponentHistory || opponentHistory.length < 3) {
            return COOPERATE; // Default to cooperate if history is undefined or has length < 3
        }

        // Check if the opponent defected in the last two rounds
        if (opponentHistory[opponentHistory.length - 1] === DEFECT && opponentHistory[opponentHistory.length - 2] === DEFECT && opponentHistory[opponentHistory.length - 3] === DEFECT) {
            return DEFECT; // Retaliate with defection
        }

        return COOPERATE; // Otherwise, cooperate
    },

    titForTatGradual: (opponentHistory, myHistory) => {
        if (!opponentHistory || opponentHistory.length === 0) {
            return COOPERATE; // Start with cooperation if no history
        }

        const defectionsCount = opponentHistory.filter(move => move === DEFECT).length;

        if (opponentHistory.slice(-defectionsCount).includes(DEFECT)) {
            //there is at least a D in the last defectionsCount moves, we need to D
            return DEFECT;
        }
        else {
            return COOPERATE;
        }
    },

    titForTatImperfect: (opponentHistory, myHistory) => {
        const imitationProbability = 0.9; // Adjust the probability as needed (between 0 and 1)
      
        if (!opponentHistory || opponentHistory.length === 0) {
          return COOPERATE; // Start with cooperation if opponent's history is undefined or empty
        }
      
        let response;
      
        // Determine the response based on TFT logic
        if (opponentHistory[opponentHistory.length - 1] === DEFECT) {
          response = DEFECT; // If opponent defected last time, respond with defection
        } else {
          response = COOPERATE; // Otherwise, cooperate
        }
      
        // Decide whether to imitate the opponent's move or not
        if (Math.random() < imitationProbability) {
          return response; // Imitate with the specified probability
        } else {
          return response === COOPERATE ? DEFECT : COOPERATE; // Opposite response with (1 - imitationProbability) chance
        }
      },

    returnAvgLast5: (opponentHistory, myHistory) => {
        // Returns the most common action of the opponent in the last 5 moves
        if (myHistory.length < 5) {
            return COOPERATE;
        }

        // Determine the most common behavior in the last 5 moves of the opponent
        const last5Moves = opponentHistory.slice(-5);
        const cooperateCount = last5Moves.filter(move => move === COOPERATE).length;
        const defectCount = last5Moves.filter(move => move === DEFECT).length;

        // Respond based on the most common behavior
        return cooperateCount > defectCount ? COOPERATE : DEFECT;

    },

    returnAvgAllDef: (opponentHistory, myHistory) => {
        // Returns the most common action of the opponent so far
        // When equal, return DEFECT
        if (myHistory.length < 1) {
            return COOPERATE;
        }

        // Determine the most common behavior in the opponent moves
        const cooperateCount = opponentHistory.filter(move => move === COOPERATE).length;
        const defectCount = opponentHistory.filter(move => move === DEFECT).length;

        // Respond based on the most common behavior
        // When equal, return DEFECT
        return cooperateCount > defectCount ? COOPERATE : DEFECT;

    },

    returnAvgAllCoop: (opponentHistory, myHistory) => {
        // Returns the most common action of the opponent so far
        // When equal, return COOPERATE
        if (myHistory.length < 1) {
            return COOPERATE;
        }

        // Determine the most common behavior in the opponent moves
        const cooperateCount = opponentHistory.filter(move => move === COOPERATE).length;
        const defectCount = opponentHistory.filter(move => move === DEFECT).length;

        // Respond based on the most common behavior
        // When equal, return COOPERATE
        return cooperateCount >= defectCount ? COOPERATE : DEFECT;

    },

    winStayLoseShift: (opponentHistory, myHistory) => {
        // In essence, the "pavlov" strategy tries to maintain its current strategy
        // (cooperate or defect) when it's working well (either CC or DC)
        // and switches its strategy when it's not (either CD or DD). 
        // This adaptive approach aims to maximize the strategy's success 
        // based on the recent game outcomes.

        // Safeguard against undefined histories
        if (!Array.isArray(myHistory) || myHistory.length === 0) {
            return COOPERATE;
        }

        const lastOwnMove = myHistory[myHistory.length - 1];
        const lastOpponentMove = opponentHistory[opponentHistory.length - 1];

        if ((lastOwnMove === COOPERATE && lastOpponentMove === COOPERATE) || 
        (lastOwnMove === DEFECT && lastOpponentMove === COOPERATE)) {
            return lastOwnMove;
        }

        return lastOwnMove === COOPERATE ? DEFECT : COOPERATE;
    },

    random50Cooperation: () => {
        return Math.random() > 0.5 ? COOPERATE : DEFECT; // 50% chance to cooperate
    },

    random70Cooperation: () => {
        return Math.random() > 0.3 ? COOPERATE : DEFECT; // 70% chance to cooperate
    },

    random80Cooperation: () => {
        return Math.random() > 0.2 ? COOPERATE : DEFECT; // 80% chance to cooperate
    },

    random90Cooperation: () => {
        return Math.random() > 0.1 ? COOPERATE : DEFECT; // 90% chance to cooperate
    },

    alternate3and3: (opponentHistory, myHistory) => {

        const moves = [COOPERATE, COOPERATE, COOPERATE, DEFECT, DEFECT, DEFECT];
        return moves[myHistory.length % moves.length];
    },

    alternateCoop: (opponentHistory, myHistory) => {
        //alternate CDCDCDC with no interest for the other player's play
        const moves = [COOPERATE, DEFECT];
        return moves[myHistory.length % moves.length];
    },

    alternateDef: (opponentHistory, myHistory) => {
        //alternate CDCDCDC with no interest for the other player's play
        const moves = [DEFECT, COOPERATE];
        return moves[myHistory.length % moves.length];
    }

};

module.exports = {
    strategies
  };
