#!/bin/bash

# Check if the number of iterations is provided as an argument.
if [ -z "$1" ]; then
  echo "Usage: $0 <number_of_iterations>"
  exit 1
fi

# Get the number of iterations from the first command-line argument.
n=$1

# Loop 'n' times to execute the command.
for (( i=1; i<=n; i++ ))
do
  echo "Generating visits, run #$i of $n..."
  /usr/local/bin/php /var/www/html/console visitorgenerator:generate-visits --no-fake --idsite 1 --custom-matomo-url=http://matomo-tracker/
done

echo "Finished. Total visits generated in $n runs."
