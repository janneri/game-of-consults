#!/bin/bash
# Usage: ./send_bot.sh bots/your-bot.scm "Bot Name"
# Registers a bot with the Game of Consults server running on localhost:3000

if [ $# -ne 2 ]; then
  echo "Usage: $0 <bot-file.scm> <bot-name>"
  exit 1
fi

BOT_FILE="$1"
BOT_NAME="$2"

if [ ! -f "$BOT_FILE" ]; then
  echo "Bot file not found: $BOT_FILE"
  exit 2
fi

BOT_CODE=$(cat "$BOT_FILE")

RESPONSE=$(curl -s -X POST "http://localhost:3000/register-bot?name=$(printf "%s" "$BOT_NAME" | jq -sRr @uri)" \
  -H "Content-Type: text/plain" \
  --data-binary @"$BOT_FILE")

if echo "$RESPONSE" | grep -q 'ok'; then
  echo "Bot '$BOT_NAME' registered successfully!"
else
  echo "Server response: $RESPONSE"
  echo "Bot registration may have failed."
fi

