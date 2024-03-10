<h3 align="center">
  <img src="assets/prisoner_dilemma.png" width="500">
</h3>

# Iterative Prisoner's Dilemma - JavaScript and TensorFlow Implementation

The program is designed to simulate 9 strategies facing each other in the Prisoner's Dilemma, a standard example of a game analyzed in game theory that shows why two completely rational individuals might not cooperate, even if it appears that it is in their best interest to do so.

This project was my first attempt at implementing the Iterative Prisoner's Dilemma game using JavaScript and TensorFlow. After exploring this initial approach, I decided to pivot towards Python. I first [implemented](https://github.com/fiore42/Prisoner-Dilemma-q_table-Python) a successful RL agent using a simple q_table approach and later I [implemented](https://github.com/fiore42/Prisoner-Dilemma-DQN-Python) an agent using a DQN (Deep Q-Networks) approach in PyTorch.

Only after they were completed I came back to try again the JavaScript approach.

The core idea remained the same across implementations: to simulate the Iterative Prisoner's Dilemma, a classic example in game theory that demonstrates the complexities of cooperative and competitive interactions between rational decision-makers.

The biggest learning by far from this project has been that the experience gained from facing an opponent cannot help (and in fact is harmful) when facing a different opponent with a different strategy. So in order to be succesful I reset weights and clear the memory of the model. I do this by calling `initializeMLStrategy` before each match.
If there is way to store all the experience from all the opponents in the model, and "remember" the correct memory after a few moves with a new opponent, I haven't found it.

I also heavily impacted the freedom of the ML agent with the knowledge that playing 'D' (DEFECT) might sometimes trigger a very negative game scenario. So in reality, I "unleash" the ML agent only if an opponent plays 'D' first. This approach has pros and cons. It always gets full marks with "nice" strategies such as TFT or "Always Cooperate", but on the other hand it doesn't get the chance to exploit a strategy such as "Always Cooperate". This is why an overall winner strategy for the IPD game cannot exist. The winner always depends on the arena in which it plays.

Once all implementations were completed, I tried to compare their results. Interesting enough, while the Python DQN approach was statistically significantly better than the Python q_table approach (after collecting data from 100 tournaments among the same fixed 9 strategies), the Python DQN implementation and the JavaScript DQN implementation were not statistically significantly different.

Next, maybe, I'll go back to the Python implementation to play with hyperparameters to see if I can improve the peformance of the agent. The current implementation (either Python or JavaScript), is always near the top and, in the worst case scenario, ends with 15% less points compared to the winner. Which is good enough for my first attempt at RL.

## Project Evolution

- **JavaScript Implementation**: Started with JavaScript and TensorFlow.
- **Python Implementations**:
  - **Q-Table Approach**: Transitioned to Python for a more traditional q_table approach. [Repo](https://github.com/fiore42/Prisoner-Dilemma-q_table-Python).
  - **DQN Approach**: Further evolved the model to use Deep Q Networks (DQN) with PyTorch. [Repo](https://github.com/fiore42/Prisoner-Dilemma-DQN-Python).

For an in-depth discussion of the project's journey and insights gained from the q_table implementation, please refer to [this Medium article](https://fiore42.medium.com/from-zero-to-reinforcement-learning-rl-with-gpt4-2977405a0223).

## Features

- **Multiple Strategies**: Implements over 25 predefined strategies, providing a rich dataset to explore various game theory dynamics.
- **Reinforcement Learning Strategy**: RL strategy using TensorFlow.js.
- **Strategy Selection**: Allows custom strategy selection through command-line arguments, offering flexibility in simulations.
- **Comprehensive Debugging and Output Options**: Includes verbose and debug modes to facilitate in-depth analysis and quicker iterations.

## Getting Started

This code was tested using Node v21.5.0 .

## Command-Line Options

- `-a`, `--against`: Specify strategy/ies to simulate against.
- `-d`, `--debug`: Select less strategies and shorter games for debugging purposes.
- `-v`, `--verbose`: Enable verbose output for detailed simulation logs.
- `-vv`: Enable very verbose output for all the ML related logging.
- `-p`, `--print`: List all available strategies for selection.

## Conclusions

It was a fun journey, starting in JavaScript, moving on to Python, downgrading to a basic q_table approach to finally understand a litlle more to go back to a DQN approach in Python and then finally back to JavaScript.
I found JavaScript initially very frustrating because it would "fail silently". Meaning the code was running but due to some data formatting or other mistakes it was not able to conclude any training cycle. In contrast my experience in Python was that it was maybe harder to get the code to work, but when it did, it actually worked and started training and making decisions.

## Contributing

Contributions to the project are welcome! Please feel free to submit a pull request or open an issue for bugs, suggestions, or feature requests.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Inspired by [this YouTube video](https://www.youtube.com/watch?v=mScpHTIi-kM) on the Prisoner's Dilemma.



