#!/bin/bash
cd /home/kavia/workspace/code-generation/literaryvibe-chat-45308-61ce92f9/literaryvibe_chat
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

