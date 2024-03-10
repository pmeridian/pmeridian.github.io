
const log = require('why-is-node-running'); // should be your first require

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});

// This code snippet above is a Node.js event handler that listens for unhandledRejection events.
// These events are emitted whenever a Promise is rejected and no error handler is attached to it. 
// The handler function then logs the unhandled rejection to the console, providing
// information about the promise that was rejected and the reason for its rejection. 
// This can be particularly useful for debugging and identifying parts of your application
// that may be causing uncaught promise rejections.

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const {
    DEBUG
} = require('./config.js');

const {
    runTournament,
    logTournament,
    printAvailableStrategies
} = require('./tournament.js');

// Function to handle playing the game
function playGame (opponentStrategies, debugCmd, verbose, veryVerbose) {
    // Your game playing code here

    let numHands, maxStrategies;

    if (DEBUG || debugCmd) {
        numHands = 200;
        maxStrategies = 3;
    }
    else {
        numHands = 1000;
        maxStrategies = 9;
    }

    // let tournamentCount = 0;

    (async function() {
        try {

            const [tournamentResults, singleGamesResults] = await runTournament(numHands, maxStrategies, opponentStrategies, verbose, veryVerbose);
            console.log("\nTournament completed.");

            logTournament (numHands, tournamentResults, singleGamesResults, verbose);


        } catch (error) {
            console.error("Error running tournaments:", error);
        }
    })();

}

function handleArguments () {

    const argv = yargs(hideBin(process.argv))
        .option('a', {
            alias: 'against',
            type: 'array',
            default: '',
            describe: 'Specify the strategy/strategies to play against',
        })
        .option('d', {
            alias: 'debug',
            type: 'boolean',
            default: false,
            description: 'Turn on debug. Less strategies, less rounds.'
          })
        .option('v', {
            alias: 'verbose',
            count: true,
            default: 0,
            describe: 'Increase verbosity level',
        })
        .option('p', {
          alias: 'print',
          type: 'boolean',
          default: false,
          description: 'Print all available strategies'
        })
        .help('help', 'Show help') // Explicitly setting the help option might not be necessary but is included for clarity
        .alias('h', 'help') // This line ensures that -h is also treated as an alias for --help      
        .version(false) // This line disables the --version option
        .parse();

    let verbose = false;
    let veryVerbose = false;

    switch(argv.verbose) {
        case 1:
            verbose = true;
            break;
        case 2:
            verbose = true;
            veryVerbose = true;
            break;
        }
    
    // console.log(`Verbose: ${verbose}`);
    // console.log(`Very Verbose: ${veryVerbose}`);
    // console.log(`Print strategies: ${argv.print}`);
    // console.log(argv.against);

    return [verbose, veryVerbose, argv.debug, argv.against, argv.print];

}

const [verbose, veryVerbose, debugCmd, opponentStrategies, printStrategies] = handleArguments ();

if (printStrategies) {
    printAvailableStrategies();
}
else {
    playGame(opponentStrategies, debugCmd, verbose, veryVerbose);    
}

