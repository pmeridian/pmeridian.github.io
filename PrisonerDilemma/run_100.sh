#!/bin/bash

# Define the opponent strategies as a variable
opponent_strategies="grudgerRecovery titForTatTrustful winStayLoseShift cooperateAlways defectAlways titForTatSuspicious alternateCoop random70Cooperation"

# Get the current date and time for the filename
current_date_time=$(date +"%Y%m%d_%H%M")

# Filename
filename="${current_date_time}.out"

# Initialize an empty result string
result=""

# Save the parameters to the output file first
echo "Parameters: $opponent_strategies" > "$filename"
echo "Results:" >> "$filename"

echo ""
# Loop to run the command 100 times
for i in {1..100}
do
    echo "Running iteration $i of 100..."
    output=$(/opt/homebrew/bin/node index.js -a $opponent_strategies | \
    grep rl_strategy | grep Points | \
    awk -F', ' '{for(i=1; i<=NF; i++) if ($i ~ /Avg Points\/Game = /) { match($i, /Avg Points\/Game = [0-9.]+/); print substr($i, RSTART + 18, RLENGTH - 18); }}' )

    # Append the output to the result string with a comma
    result="$result, $output"
done

# Remove the last ", " from the accumulated result
result="${result:2}"

# Print the accumulated result (excluding the leading comma) on the screen
echo ""
echo "Accumulated Result:"
echo "$result"

# Save the accumulated result to a file
echo "$result" >> "$filename"

# Print a note on the screen
echo ""
echo "The parameters and the accumulated result have been saved to $filename ."
echo ""

