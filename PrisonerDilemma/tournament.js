
const {
    COOPERATE,
    DEFECT,
    COOPERATEML,
    DEFECTML,
    DEBUG,
    howManyChPerRow,
    POINTS_SYSTEM
} = require('./config.js');

const {
    strategies
  } = require('./strategies.js');

const { 
    initializeMLStrategy
} = require('./reinforcement_learning.js');

//   const { 
//     MLStrategy,
//     initializeMLStrategy
// } = require('./reinforcement_learning.js');


function getScores(decision1, decision2) {
    // Combine the decisions to form the key (e.g., 'CC', 'CD', 'DC', 'DD')
    const key = decision1 + decision2;

    // Access the POINTS_SYSTEM with the key to get the scores
    const scores = POINTS_SYSTEM[key];

    // Check if scores were found for the provided decisions
    if (scores) {
        // Return the scores if found
        return scores; // This returns an array [score1, score2]
    } else {
        // Return a default or error if the key doesn't exist in POINTS_SYSTEM
        console.error("Invalid decisions provided.");
        return null; // Or handle this case as appropriate for your application
    }
}


function initTournamentResults (selectedStrategiesNames) {
    const tournamentResults = {};

    const singleGamesResults = {};

    for (const strategyName1 of selectedStrategiesNames) {
      singleGamesResults[strategyName1] = {};
    
      for (const strategyName2 of selectedStrategiesNames) {
        singleGamesResults[strategyName1][strategyName2] = {
          score1: 0,
          score2: 0,
          avgPoints1: 0,
          avgPoints2: 0,
          handsPlayed: 0,
        };
      }
    }

    for (const strategyName of selectedStrategiesNames) {
        tournamentResults[strategyName] = {
            position: 0,
            totalScore: 0,
            handsPlayed: 0,
            avgPointsPerGame: 0,
            
        }
    }

    // console.log (`[initTournamentResults] singleGamesResults: ${JSON.stringify(singleGamesResults)}`)

    
    return [tournamentResults, singleGamesResults];

};

function printAvailableStrategies () {
    console.log ("\nThese are all the available strategies:\n");
    Object.keys(strategies).forEach(strategyName => {
        console.log(`Strategy: ${strategyName}`);
        // Additional logic here if you need to do something with the strategy names
    });
    console.log ("");
}


function selectStrategies(maxStrategies, opponentStrategies) {
    // Randomly select X strategies

    const availableStrategies = Object.keys(strategies);

    const strategiesNames = [];

    let forcedStrategies;

    let isAllEmptyStrings = opponentStrategies.every(element => element === '');

    if (isAllEmptyStrings) {
        forcedStrategies = ['machineLearningOne'];
    } else {
        forcedStrategies = ['machineLearningOne'].concat(opponentStrategies);
    }
    
    // for (let i = 0; i < forcedStrategies.length; i++) {
    //     console.log(`[${i + 1}] ${forcedStrategies[i]}`);
    // }

    forcedStrategies.forEach(forcedStrategy => {
        if (forcedStrategy in strategies) {
          strategiesNames.push(forcedStrategy); // forces strategy to be always picked
        } else {
          console.log(`\n[selectStrategies] ERROR strategy not found: ${forcedStrategy}`);
        }
    });

    while (strategiesNames.length < maxStrategies) {
        // select a random index
        const randomIndex = Math.floor(Math.random() * availableStrategies.length);
        const selectedStrategy = availableStrategies[randomIndex];

        // Ensure the selected strategy is not already in strategiesNames
        if (!strategiesNames.includes(selectedStrategy)) {
            strategiesNames.push(selectedStrategy);
        }
    };

    console.log(`\nSelected strategies for this tournament:\n`);

    strategiesNames.forEach(strategy => {
        console.log(`${strategy}`);
    });

    // console.log (`[selectStrategies] strategiesNames: ${JSON.stringify(strategiesNames)}`)

    return strategiesNames;
}

// Simulate a match between two strategies
async function simulateMatch (strategy1, strategy2, rounds, verbose, veryVerbose) {
    let history1 = [], history2 = []; // Arrays to store choices made in each round
    let scores1 = [], scores2 = []; // Arrays to store scores for each round
    //let choices1 = [], choices2 = []; // Arrays to store choices made in each round

    let score1 = 0, score2 = 0;

    let decisionCount = 0;

    // exploreFlagX allows or inhibits the explorative aspect of the RL approach
    // This is implemented because epsilon is cut in half each time it's used
    // and I don't want to screw up the learning when the ML agent plays itself
    // so I let only one explore
    let exploreFlag1 = false;
    let exploreFlag2 = false;

    if ((strategy1.name === "machineLearningOne" && strategy2.name === "machineLearningOne") || strategy1.name === "machineLearningOne"){
        // console.log (`[simulateMatch] set exploreFlag1 to true`)
        exploreFlag1 = true;
    }
    else if (strategy2.name === "machineLearningOne") {
        // console.log (`[simulateMatch] set exploreFlag2 to true`)
        exploreFlag2 = true;
    }

    let mlStrategy; 
    if (strategy1.name === "machineLearningOne" || strategy2.name === "machineLearningOne"){
        // console.log (`[simulateMatch] set exploreFlag1 to true`)
        mlStrategy = await initializeMLStrategy();
    }


    for (let round = 0; round < rounds; round++) {

        //console.log (`strategy1: ${strategy1} strategy2: ${strategy2}`)

        //return [score1, score2, scores1, scores2, choices1, choices2]; //DEBUG DELETE DELETE

        // console.log (`[simulateMatch] exploreFlag1: ${exploreFlag1}`)
        // console.log (`[simulateMatch] exploreFlag2: ${exploreFlag2}`)

        let [choice1, choice2] = await Promise.all([
            strategy1.name === "machineLearningOne" ? strategy1(history2, history1, decisionCount, exploreFlag1, veryVerbose, mlStrategy) : strategy1(history2, history1),
            strategy2.name === "machineLearningOne" ? strategy2(history1, history2, decisionCount, exploreFlag2, veryVerbose, mlStrategy) : strategy2(history1, history2)
        ]);

        const [roundScore1, roundScore2] = getScores(choice1, choice2);

        // const [roundScore1, roundScore2] = score(choice1, choice2, points);

        // ML RELATED QUESTIONS that came to my mind playing with this:
        // should I only train the model with its own game (plus some randomness introduce by epsilon)
        // or should I train it with other strategies gameplay to learn? 
        // answer: try both and see what happens
        // should I use only the last score as label or the total score of the 10 rounds? 
        // answer: try both and see what happens
        // UPDATE! WRONG! I cannot send the score as label, it makes no sense, what would the model learn?
        // right now I'm only training with its own games and the last score 


        if (strategy1.name === "machineLearningOne") {
            if (veryVerbose) {
                console.log (`[simulateMatch] decisionCount: ${decisionCount} ${strategy1.name} vs ${strategy2.name}`)
                console.log (`[simulateMatch] decisionCount: ${decisionCount} calling trainModel as such history1: ${history1.slice(-5)} history2: ${history2.slice(-5)} mlScore: ${roundScore1} choice1: ${choice1} choice2: ${choice2}`)
            }
            await mlStrategy.trainModel(history1, history2, choice1, choice2, veryVerbose)  
            decisionCount++; // Increment the counter after each decision
        }
        else if (strategy2.name === "machineLearningOne") {
            if (veryVerbose) {
                console.log (`[simulateMatch] decisionCount: ${decisionCount} ${strategy1.name} vs ${strategy2.name}`)
                console.log (`[simulateMatch] decisionCount: ${decisionCount} calling trainModel as such history2: ${history2.slice(-5)} history1: ${history1.slice(-5)} mlScore: ${roundScore2} choice2: ${choice2} choice1: ${choice1}`)
            }
            await mlStrategy.trainModel(history2, history1, choice2, choice1, veryVerbose)  
            decisionCount++; // Increment the counter after each decision
        }

        history1.push(choice1);
        history2.push(choice2);

        score1 += roundScore1;
        score2 += roundScore2;

    }

    return [score1, score2, history1, history2];

};

// print(f"{name1} vs {name2} num_rounds: {num_rounds} score1: {total_score1} score2: {total_score2}")
// for i in range(len(history1)):
//     pair = history1[i] + history2[i]
//     # if pair in ["CC", "DC"]:
//     if pair in ["CD"]:
//         print(f"\033[1m{pair}\033[0m", end=" ")
//     else:
//         print(pair, end=" ")
//     if (i + 1) % 20 == 0:
//         print("")  # Newline character after every 20 pairs

function printMatchHistory(history1, history2) {
    const maxPairsPerRow = 20;
    let pairsPrinted = 0;
  
    for (let i = 0; i < history1.length || i < history2.length; i++) {
        const element1 = history1[i] || ''; // Use an empty string if history1 is shorter
        const element2 = history2[i] || ''; // Use an empty string if history2 is shorter

        const string = element1 + element2;
    
        if (string == 'CD') {
            process.stdout.write(`\x1b[1m${string} \x1b[0m`);
        }
        else {
            // Print the elements with a space between them
            process.stdout.write(`${string} `);
        }
    
        pairsPrinted++;
    
        // Check if we've printed the maximum pairs per row
        if (pairsPrinted === maxPairsPerRow) {
            console.log(); // Start a new row
            pairsPrinted = 0; // Reset the pair counter
        }
        }
  }


function logTournament (handsPerMatch, tournamentResults, singleGamesResults, verbose) {


    //calculate the maximum length of the strategy names
    const maxStrategyNameLength = Math.max(...Object.keys(tournamentResults).map(name => name.length));

    const numStrategies = Object.keys(tournamentResults).length;

    const totalHandsPerStrategy = numStrategies*2*handsPerMatch;

    console.log(`\nHands per match: ${handsPerMatch} Total hands played by each strategy: ${totalHandsPerStrategy}`);

    // Find the highest score
    const highestScore = Math.max(...Object.values(tournamentResults).map(r => r.totalScore));

    const highestScoreAsString = highestScore.toString();
    const numberOfDigits = highestScoreAsString.length;

    const sortedResults = Object.entries(tournamentResults).sort((a, b) => b[1].totalScore - a[1].totalScore);

    // console.log('sortedResults:', JSON.stringify(sortedResults));

    // singleGamesResults[name1][name2].score1 = score1;
    // singleGamesResults[name1][name2].score2 = score2;
    // singleGamesResults[name1][name2].avgPoints1 = score1/handsPerMatch;
    // singleGamesResults[name1][name2].avgPoints2 = score2/handsPerMatch;
    // singleGamesResults[name1][name2].handsPlayed = handsPerMatch;


    // percent_diff = int((total_score1 - total_score2) / total_score2 * 100) if total_score2 > 0 else 0



    let score1, score2, avgPoints1, avgPoints2, deltaAverageMatch;

    console.log(`\nTourament results:`);
    sortedResults.forEach(([name1, _]) => {
        for (const name2 in singleGamesResults[name1]) {
            if (singleGamesResults[name1].hasOwnProperty(name2)) {
                score1 = singleGamesResults[name1][name2].score1;
                score2 = singleGamesResults[name1][name2].score2;
                avgPoints1 = singleGamesResults[name1][name2].avgPoints1;
                avgPoints2 = singleGamesResults[name1][name2].avgPoints2;
                if (score2 > 0) {
                    deltaAverageMatch = Math.trunc((score1 - score2) / score2 * 100);
                }
                else {
                    deltaAverageMatch = 0;
                }
                if (deltaAverageMatch >= 100) {
                    deltaAverageMatch = 100 //switch cannot handle >=
                }
                let deltaAverageString
                switch (deltaAverageMatch) {
                    case 0:
                        deltaAverageString = "";
                        break;
                    case 100:
                        deltaAverageString = "Diff >100";
                        break;
                    case -100:
                        deltaAverageString = "YOU LOST";
                        break;
                    default:
                        deltaAverageString = `Diff: ${deltaAverageMatch}%`;
                  }
                let string = `${name1.padEnd(maxStrategyNameLength)} vs ${name2.padEnd(maxStrategyNameLength + 1)}: `;
                string += `${score1.toString().padStart(numberOfDigits)} - ${score2.toString().padStart(numberOfDigits)}`;
                string += ` (Avg: ${avgPoints1.toFixed(2)} - ${avgPoints2.toFixed(2)}) `;
                string += deltaAverageString;

                console.log (`${string}`);
            }
          }
        console.log (``);
        });

    // Output overall results
    console.log('Sorted stragies:');

    let position = 0; //counts the relative position of this strategy in this tournament
    let avgPointsBestGame = 0;

    sortedResults.forEach(([strategy, { totalScore, handsPlayed }]) => {

        tournamentResults[strategy].position = ++position;

        // Calculate the average score per game, rounded
        const avgPointsPerGame = (totalScore / handsPlayed).toFixed(2);
        tournamentResults[strategy].avgPointsPerGame = avgPointsPerGame;

        if (totalScore === highestScore) {
            avgPointsBestGame = avgPointsPerGame;
        }

        deltaAverage = Math.trunc((avgPointsPerGame - avgPointsBestGame) / avgPointsBestGame * 100)

        let deltaAvgString = ""

        if (deltaAverage < 0) {
            deltaAvgString = `, Delta Avg = ${deltaAverage}%`
        }

        finalString = `${strategy.padEnd(maxStrategyNameLength + 1)}: Total Points = ${totalScore.toString().padStart(numberOfDigits)}, Avg Points/Game = ${avgPointsPerGame.padStart(4)}${deltaAvgString}`;

        if (strategy == 'machineLearningOne') {
            console.log(`\x1b[1m${finalString} \x1b[0m`);
        }
        else {
            console.log(`${finalString}`);
        }

    });

    console.log("");

}

async function runTournament (handsPerMatch, maxStrategies, opponentStrategies, verbose, veryVerbose) {

    // Tournament

    let selectedStrategiesNames = selectStrategies(maxStrategies, opponentStrategies);

    // tournamentResults[strategy] = {
    //     position: 0,
    //     totalScore: 0,
    //     handsPlayed: 0,
    //     avgPointsPerGame: 0,
    // };

    //this stores all results of each strategy for each tournament to calculate averages
    const [tournamentResults, singleGamesResults] = initTournamentResults(selectedStrategiesNames);

    // return tournamentResults;

    let matchCount = 0;

    console.log ("");

    for (let name1 of selectedStrategiesNames) {

        // if (verbose) {
        //     console.log(`New set of matches: ${name1}`);
        //     console.log("");
        // }

        //strategiesNames.forEach(name2 => {
        for (let name2 of selectedStrategiesNames) {

            const matchCountString = (matchCount+1).toString().padStart(2, ' ');

            if (verbose) {
                console.log (`\nMatch ${matchCountString} - ${name1} vs ${name2} - will play ${handsPerMatch} hands.`);
            }
            else {
                process.stdout.write('.'); //Print one dot for each game played
            }
            const [score1, score2, history1, history2] = await simulateMatch(strategies[name1], strategies[name2], handsPerMatch, verbose, veryVerbose);
            // console.log (`\nmatch ${name1} (score: ${score1}) vs ${name2} (score: ${score2})`);

            // console.log(`name1: ${name1} name2: ${name2}`);

            tournamentResults[name1].totalScore += score1;
            tournamentResults[name1].handsPlayed += handsPerMatch; 
            tournamentResults[name2].totalScore += score2;
            tournamentResults[name2].handsPlayed += handsPerMatch; 
            ++matchCount;

            singleGamesResults[name1][name2].score1 = score1;
            singleGamesResults[name1][name2].score2 = score2;
            singleGamesResults[name1][name2].avgPoints1 = score1/handsPerMatch;
            singleGamesResults[name1][name2].avgPoints2 = score2/handsPerMatch;
            singleGamesResults[name1][name2].handsPlayed = handsPerMatch;

            if (verbose) {
                console.log (`\nMatch ${matchCountString} - ${name1} vs ${name2} - score1: ${score1} score2: ${score2}`);
                printMatchHistory(history1, history2);
            }            

        };

    };

    if (!verbose) {
        process.stdout.write('\n'); //Add \n after printing all the dots
    }


    // console.log('tournamentResults:', JSON.stringify(tournamentResults, null, 2));


    return [tournamentResults, singleGamesResults];

};

  module.exports = {
    runTournament,
    logTournament,
    printAvailableStrategies
  };


