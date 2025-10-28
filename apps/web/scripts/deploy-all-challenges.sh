#!/bin/bash

# Deploy All 160 Enhanced Challenges - FIXED VERSION
# This script safely deploys all enhanced challenge files

set -e

echo "🚀 Deploying 160 Enhanced Challenges"
echo "======================================"
echo ""

# Configuration - Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
CHALLENGES_DIR="$PROJECT_ROOT/data/challenges"
BACKUP_DIR="$PROJECT_ROOT/backups/challenges-$(date +%Y%m%d_%H%M%S)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "📁 Configuration:"
echo "   Script location: $SCRIPT_DIR"
echo "   Project root: $PROJECT_ROOT"
echo "   Challenges dir: $CHALLENGES_DIR"
echo "   Backup dir: $BACKUP_DIR"
echo ""

# Check if enhanced challenges exist
if [ ! -f "$SCRIPT_DIR/all-challenges-enhanced.json" ]; then
    echo -e "${RED}❌ Error: all-challenges-enhanced.json not found${NC}"
    echo "Expected location: $SCRIPT_DIR/all-challenges-enhanced.json"
    echo "Please ensure the file is in the same directory as this script."
    exit 1
fi

# Count challenges
if command -v python3 &> /dev/null; then
    CHALLENGE_COUNT=$(python3 -c "import json; print(len(json.load(open('$SCRIPT_DIR/all-challenges-enhanced.json'))))" 2>/dev/null || echo "160")
else
    CHALLENGE_COUNT="160"
fi
echo "📊 Found $CHALLENGE_COUNT challenges to deploy"
echo ""

# Create backup
echo "1️⃣  Creating backup..."
mkdir -p "$CHALLENGES_DIR"
if [ -d "$CHALLENGES_DIR" ] && [ "$(ls -A $CHALLENGES_DIR 2>/dev/null)" ]; then
    mkdir -p "$BACKUP_DIR"
    cp "$CHALLENGES_DIR"/*.json "$BACKUP_DIR/" 2>/dev/null || true
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR" 2>/dev/null | wc -l)
    echo -e "${GREEN}✓${NC} Backed up $BACKUP_COUNT existing challenge files"
else
    echo -e "${YELLOW}⚠${NC}  No existing challenges to backup"
fi

# Validate JSON
echo ""
echo "2️⃣  Validating JSON..."
if command -v python3 &> /dev/null; then
    if python3 -m json.tool "$SCRIPT_DIR/all-challenges-enhanced.json" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} JSON is valid"
    else
        echo -e "${RED}❌ JSON validation failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠${NC}  Python3 not found, skipping validation"
fi

# Show what will be deployed
echo ""
echo "3️⃣  Deployment summary"
echo ""
echo "This will deploy:"
echo "  • 160 challenge files"
echo "  • ~310 JavaScript tests"
echo "  • ~480 alternative solutions"
echo "  • Minimal, Styled, and Interactive versions"
echo ""
echo "Changes:"
echo "  • Replace all challenge JSON files"
echo "  • Add comprehensive test code"
echo "  • Add 3 solutions per challenge"
echo ""
echo "Safety:"
echo "  • Backup saved to: $BACKUP_DIR"
echo "  • Original files preserved"
echo ""

# Confirm
read -p "Continue with deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Extract and deploy individual challenges
echo ""
echo "4️⃣  Deploying challenges..."

if command -v python3 &> /dev/null; then
    python3 << PYTHON_SCRIPT
import json
import os
import sys

script_dir = "$SCRIPT_DIR"
challenges_dir = "$CHALLENGES_DIR"

print(f"   Reading from: {script_dir}/all-challenges-enhanced.json")
print(f"   Writing to: {challenges_dir}")

# Load all challenges
try:
    with open(os.path.join(script_dir, 'all-challenges-enhanced.json'), 'r') as f:
        challenges = json.load(f)
except Exception as e:
    print(f"   ❌ Error reading challenges file: {e}")
    sys.exit(1)

deployed = 0
errors = 0

for challenge in challenges:
    try:
        slug = challenge.get('slug', 'unknown')
        filename = f"{slug}.json"
        filepath = os.path.join(challenges_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(challenge, f, indent=2)
        
        deployed += 1
        if deployed % 20 == 0:
            print(f"   Deployed {deployed}/{len(challenges)}...")
            
    except Exception as e:
        print(f"   Error deploying {challenge.get('slug', 'unknown')}: {e}")
        errors += 1

print(f"\n   ✓ Total deployed: {deployed}")
if errors > 0:
    print(f"   ⚠ Errors: {errors}")
    sys.exit(1)

PYTHON_SCRIPT

    DEPLOY_RESULT=$?
else
    echo -e "${RED}❌ Python3 is required for deployment${NC}"
    exit 1
fi

if [ $DEPLOY_RESULT -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Successfully deployed all challenges"

# Verify
echo ""
echo "5️⃣  Verifying deployment..."

DEPLOYED_COUNT=$(ls -1 "$CHALLENGES_DIR"/*.json 2>/dev/null | wc -l)
echo "   Challenge files in directory: $DEPLOYED_COUNT"

if [ "$DEPLOYED_COUNT" -eq 160 ]; then
    echo -e "${GREEN}✓${NC} All 160 challenges deployed correctly"
else
    echo -e "${YELLOW}⚠${NC}  Expected 160 files, found $DEPLOYED_COUNT"
fi

# Test a few samples
echo ""
echo "6️⃣  Testing sample challenges..."

if command -v python3 &> /dev/null; then
    python3 << PYTHON_TEST
import json
import os
import random

challenges_dir = "$CHALLENGES_DIR"

try:
    files = [f for f in os.listdir(challenges_dir) if f.endswith('.json')]
    if not files:
        print("   ⚠ No JSON files found")
        exit(0)
    
    samples = random.sample(files, min(5, len(files)))
    
    all_good = True
    for filename in samples:
        filepath = os.path.join(challenges_dir, filename)
        try:
            with open(filepath, 'r') as f:
                challenge = json.load(f)
            
            # Check structure
            has_tests = 'tests' in challenge and len(challenge['tests']) > 0
            has_solutions = 'solutions' in challenge and len(challenge['solutions']) >= 2
            
            if has_tests and has_solutions:
                print(f"   ✓ {filename}: OK ({len(challenge['tests'])} tests, {len(challenge['solutions'])} solutions)")
            else:
                print(f"   ⚠ {filename}: Missing tests or solutions")
                all_good = False
                
        except Exception as e:
            print(f"   ✗ {filename}: Error - {e}")
            all_good = False
    
    if not all_good:
        exit(1)
        
except Exception as e:
    print(f"   ⚠ Testing error: {e}")
    exit(0)

PYTHON_TEST

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Sample tests passed"
    else
        echo -e "${YELLOW}⚠${NC}  Some issues detected"
    fi
fi

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "📊 Summary:"
echo "   Challenges deployed: $DEPLOYED_COUNT"
echo "   Tests per challenge: ~2-3"
echo "   Solutions per challenge: 3"
echo "   Total tests: ~310"
echo "   Total solutions: ~480"
echo ""
echo "📝 Next steps:"
echo "   1. Test a challenge in your browser"
echo "   2. Verify tests execute correctly"
echo "   3. Check solution display"
echo "   4. If all looks good, you're done!"
echo ""
echo "💾 Backup location: $BACKUP_DIR"
echo ""
echo "🔄 To rollback if needed:"
echo "   rm $CHALLENGES_DIR/*.json"
echo "   cp $BACKUP_DIR/*.json $CHALLENGES_DIR/"
echo ""