#!/bin/bash

# APK Management Script for PornMake
# Usage: ./add-apk.sh <path-to-apk> <app-name>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/apks.json"
APKS_DIR="$SCRIPT_DIR"
BASE_URL="https://liteinx.github.io/PornMake"

# Function to generate random code
generate_code() {
    # Generate 5-character alphanumeric code (A-Z, 0-9, excluding confusing chars)
    chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'  # No I, O, 0, 1 to avoid confusion
    code=''

    for i in {1..5}; do
        code="${code}${chars:RANDOM%${#chars}:1}"
    done

    echo "$code"
}

# Function to check if code already exists
code_exists() {
    local code=$1
    if grep -q "\"$code\"" "$CONFIG_FILE" 2>/dev/null; then
        return 0  # Code exists
    else
        return 1  # Code doesn't exist
    fi
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}✗ Error: jq is not installed${NC}"
    echo -e "${YELLOW}Install jq:${NC}"
    echo -e "  Ubuntu/Debian: ${BLUE}sudo apt-get install jq${NC}"
    echo -e "  macOS: ${BLUE}brew install jq${NC}"
    exit 1
fi

# Check arguments
if [ $# -lt 1 ]; then
    echo -e "${RED}✗ Error: Missing arguments${NC}"
    echo -e "\n${YELLOW}Usage:${NC} $0 <path-to-apk> [app-name]"
    echo -e "\n${YELLOW}Example:${NC} $0 ~/Downloads/my-app.apk \"Custom Build\""
    exit 1
fi

# Get arguments
APK_PATH="$1"
APP_NAME="${2:-Custom Build}"

# Check if APK file exists
if [ ! -f "$APK_PATH" ]; then
    echo -e "${RED}✗ Error: APK file not found: $APK_PATH${NC}"
    exit 1
fi

# Check if it's an APK file
if [[ ! "$APK_PATH" =~ \.apk$ ]]; then
    echo -e "${RED}✗ Error: File must have .apk extension${NC}"
    exit 1
fi

# Get APK filename
APK_FILENAME=$(basename "$APK_PATH")
DEST_PATH="$APKS_DIR/$APK_FILENAME"

# Check if APK already exists in directory
if [ -f "$DEST_PATH" ]; then
    echo -e "${YELLOW}⚠ Warning: APK file already exists in PornMake directory${NC}"
    read -p "Overwrite existing file? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}✗ Cancelled${NC}"
        exit 1
    fi
fi

# Copy APK to PornMake directory
echo -e "${BLUE}📦 Copying APK to PornMake directory...${NC}"
cp "$APK_PATH" "$DEST_PATH"

# Get file size
FILE_SIZE=$(du -h "$DEST_PATH" | cut -f1)

# Generate unique code
echo -e "${BLUE}🔑 Generating unique code...${NC}"
CODE=""
MAX_ATTEMPTS=100
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    CODE=$(generate_code)
    if ! code_exists "$CODE"; then
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${RED}✗ Error: Could not generate unique code${NC}"
    rm "$DEST_PATH"
    exit 1
fi

# Get current date
CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Add to apks.json
echo -e "${BLUE}📝 Updating apks.json...${NC}"

# Check if config file exists, create if not
if [ ! -f "$CONFIG_FILE" ]; then
    echo '{"default":"'$APK_FILENAME'","apps":{}}' > "$CONFIG_FILE"
fi

# Use jq to add new entry
tmp=$(mktemp)
jq --arg code "$CODE" \
   --arg filename "$APK_FILENAME" \
   --arg name "$APP_NAME" \
   --arg added "$CURRENT_DATE" \
   '.apps[$code] = {"filename": $filename, "name": $name, "added": $added, "downloads": 0}' "$CONFIG_FILE" > "$tmp"

mv "$tmp" "$CONFIG_FILE"

# Success!
echo -e "\n${GREEN}✅ APK added successfully!${NC}\n"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📦 File:${NC}        $APK_FILENAME"
echo -e "${BLUE}📏 Size:${NC}        $FILE_SIZE"
echo -e "${BLUE}🏷️  Name:${NC}        $APP_NAME"
echo -e "${BLUE}🔑 Code:${NC}        $CODE"
echo -e "${BLUE}📅 Added:${NC}       $CURRENT_DATE"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
echo -e "${GREEN}🔗 Share link:${NC} ${BLUE}$BASE_URL/?r=$CODE${NC}\n"
echo -e "${YELLOW}💡 Tip: Commit and push changes to GitHub to deploy${NC}\n"
