#!/bin/bash

if [ "$#" -gt 1 ]; then
  echo "Usage: $0 [server-url]"
  exit 1
fi

SERVER_URL="${1:-http://localhost:3000}"
STATUS=0

./send_bot.sh bots/hard-market-bot.scm "HardMarket" "$SERVER_URL" || STATUS=1
./send_bot.sh bots/easy-market-bot.scm "EasyMarket" "$SERVER_URL" || STATUS=1
./send_bot.sh bots/study-hard-bot.scm "StudyHard" "$SERVER_URL" || STATUS=1
./send_bot.sh bots/just-relax-bot.scm "JustRelax" "$SERVER_URL" || STATUS=1

exit "$STATUS"
