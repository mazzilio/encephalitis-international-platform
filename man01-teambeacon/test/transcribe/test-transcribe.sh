#!/bin/bash

# Transcription API Testing Script
# Tests the transcription endpoint with sample audio

API_ENDPOINT=${1:-"https://dcs80nn4h5.execute-api.us-west-2.amazonaws.com/dev/transcribe"}

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🎤 TeamBeacon Transcription API Test${NC}"
echo "Endpoint: $API_ENDPOINT"
echo "=========================================="
echo ""

# Check if sample audio file exists
if [ ! -f "sample-audio-base64.txt" ]; then
    echo -e "${YELLOW}⚠️  No sample audio file found${NC}"
    echo "Creating a test payload with sample text..."
    echo ""
    
    # Create a simple test payload (you'll need to replace this with actual base64 audio)
    echo -e "${YELLOW}Note: This is a placeholder. For real testing, you need:${NC}"
    echo "1. Record a short audio file (WAV format)"
    echo "2. Convert to base64: base64 -i audio.wav > sample-audio-base64.txt"
    echo "3. Run this script again"
    echo ""
    exit 1
fi

# Read base64 audio data
AUDIO_DATA=$(cat sample-audio-base64.txt | tr -d '\n')

echo -e "${GREEN}Test 1: Transcribe with Auto Language Detection${NC}"
echo "-----------------------------------"
curl -s -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"audioData\": \"$AUDIO_DATA\",
    \"sourceLanguage\": \"auto\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S)\"
  }" | python3 -m json.tool

echo ""
echo ""

echo -e "${GREEN}Test 2: Transcribe with English Language${NC}"
echo "-----------------------------------"
curl -s -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"audioData\": \"$AUDIO_DATA\",
    \"sourceLanguage\": \"en\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S)\"
  }" | python3 -m json.tool

echo ""
echo ""
echo -e "${BLUE}✅ Test Complete!${NC}"
echo ""
echo "To test with your own audio:"
echo "  1. Record audio: sox -d -r 16000 -c 1 audio.wav trim 0 10"
echo "  2. Convert to base64: base64 -i audio.wav > sample-audio-base64.txt"
echo "  3. Run: ./test-transcribe.sh"
