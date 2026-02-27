#!/bin/bash

# Helper script to create test audio for transcription testing
# This creates a simple audio file with text-to-speech

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🎤 Creating Test Audio File${NC}"
echo "=========================================="
echo ""

# Check if 'say' command exists (macOS)
if command -v say &> /dev/null; then
    echo "Using macOS text-to-speech..."
    
    # Create audio file
    say -o test-audio.aiff "Hello, I am experiencing memory issues and need help with encephalitis support."
    
    # Convert to WAV format
    if command -v ffmpeg &> /dev/null; then
        ffmpeg -i test-audio.aiff -ar 16000 -ac 1 test-audio.wav -y 2>/dev/null
        rm test-audio.aiff
    elif command -v sox &> /dev/null; then
        sox test-audio.aiff -r 16000 -c 1 test-audio.wav
        rm test-audio.aiff
    else
        echo -e "${YELLOW}⚠️  ffmpeg or sox not found. Install with: brew install ffmpeg${NC}"
        echo "Using .aiff file instead..."
        mv test-audio.aiff test-audio.wav
    fi
    
    # Convert to base64
    base64 -i test-audio.wav > sample-audio-base64.txt
    
    echo -e "${GREEN}✅ Created test-audio.wav and sample-audio-base64.txt${NC}"
    echo ""
    echo "File size: $(wc -c < test-audio.wav) bytes"
    echo "Base64 size: $(wc -c < sample-audio-base64.txt) bytes"
    echo ""
    echo "Now run: ./test-transcribe.sh"
    
elif command -v espeak &> /dev/null; then
    echo "Using espeak text-to-speech..."
    espeak "Hello, I am experiencing memory issues and need help with encephalitis support." -w test-audio.wav
    
    # Convert to base64
    base64 -i test-audio.wav > sample-audio-base64.txt
    
    echo -e "${GREEN}✅ Created test-audio.wav and sample-audio-base64.txt${NC}"
    echo ""
    echo "Now run: ./test-transcribe.sh"
    
else
    echo -e "${YELLOW}⚠️  No text-to-speech tool found${NC}"
    echo ""
    echo "Options:"
    echo "1. macOS: 'say' command is built-in"
    echo "2. Linux: Install espeak: sudo apt-get install espeak"
    echo "3. Manual: Record audio and convert:"
    echo "   - Record: sox -d -r 16000 -c 1 test-audio.wav trim 0 10"
    echo "   - Convert: base64 -i test-audio.wav > sample-audio-base64.txt"
    echo ""
    echo "Or use this Python script:"
    cat << 'EOF'
    
# Python alternative (requires pyttsx3)
import pyttsx3
import base64

engine = pyttsx3.init()
engine.save_to_file('Hello, I need help with memory issues', 'test-audio.wav')
engine.runAndWait()

with open('test-audio.wav', 'rb') as f:
    audio_data = base64.b64encode(f.read()).decode()
    with open('sample-audio-base64.txt', 'w') as out:
        out.write(audio_data)
EOF
fi
