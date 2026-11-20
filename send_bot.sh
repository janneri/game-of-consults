#!/bin/bash
# Usage: ./send_bot.sh bots/your-bot.scm "Bot Name" [server-url]
# Defaults to the local Game of Consultants server.

if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
  echo "Usage: $0 <bot-file.scm> <bot-name> [server-url]"
  exit 1
fi

BOT_FILE="$1"
BOT_NAME="$2"
SERVER_URL="${3:-http://localhost:3000}"

while [[ "$SERVER_URL" == */ ]]; do
  SERVER_URL="${SERVER_URL%/}"
done

if [[ "$SERVER_URL" != http://* && "$SERVER_URL" != https://* ]]; then
  echo "Server URL must start with http:// or https://: $SERVER_URL" >&2
  exit 1
fi

if [ ! -f "$BOT_FILE" ]; then
  echo "Bot file not found: $BOT_FILE"
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to encode the bot name in the request URL." >&2
  exit 3
fi

ENCODED_BOT_NAME=$(printf "%s" "$BOT_NAME" | jq -sRr @uri)

if ! RESPONSE=$(curl -sS -X POST "$SERVER_URL/register-bot?name=$ENCODED_BOT_NAME" \
  -H "Content-Type: text/plain" \
  --data-binary @"$BOT_FILE"); then
  echo "Request to $SERVER_URL failed." >&2
  exit 3
fi

if printf "%s" "$RESPONSE" | jq -e '.ok == true' >/dev/null 2>&1; then
  echo "Bot '$BOT_NAME' registered successfully!"
else
  echo "Server response: $RESPONSE"
  exit 1
fi
