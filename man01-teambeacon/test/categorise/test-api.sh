#!/bin/bash

# API Testing Script
# Tests the deployed API with various scenarios

API_ENDPOINT=${1:-"https://dcs80nn4h5.execute-api.us-west-2.amazonaws.com/dev/api"}

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🧪 TeamBeacon API Test Suite${NC}"
echo "Endpoint: $API_ENDPOINT"
echo "=========================================="
echo ""

# Test 1: Patient with memory issues
echo -e "${GREEN}Test 1: Patient with Memory Issues${NC}"
echo "-----------------------------------"
curl -s -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "userRole": "patient",
    "userQuery": "I am experiencing memory issues and need help",
    "userQueryType": "Text",
    "userData": {
      "stage": "long_term_management",
      "concerns": ["memory"],
      "ageGroup": "adult"
    },
    "limit": 5
  }' | python3 -m json.tool

echo ""
echo ""

# Test 2: Parent with child at school
echo -e "${GREEN}Test 2: Parent - Child School Support${NC}"
echo "-----------------------------------"
curl -s -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "userRole": "parent",
    "userQuery": "My child is having trouble at school after encephalitis",
    "userQueryType": "Text",
    "userData": {
      "stage": "long_term_management",
      "concerns": ["school", "behaviour"],
      "ageGroup": "child"
    },
    "limit": 5
  }' | python3 -m json.tool

echo ""
echo ""

# Test 3: Caregiver legal question
echo -e "${GREEN}Test 3: Caregiver - Legal Support${NC}"
echo "-----------------------------------"
curl -s -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "userRole": "caregiver",
    "userQuery": "What legal support is available?",
    "userQueryType": "Text",
    "userData": {
      "stage": "long_term_management",
      "concerns": ["legal"],
      "ageGroup": "adult"
    },
    "limit": 5
  }' | python3 -m json.tool

echo ""
echo ""

# Test 4: Professional research
echo -e "${GREEN}Test 4: Professional - Research Query${NC}"
echo "-----------------------------------"
curl -s -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "userRole": "professional",
    "userQuery": "Latest research on autoimmune encephalitis",
    "userQueryType": "Text",
    "userData": {
      "stage": "acute_hospital",
      "concerns": ["research"],
      "ageGroup": "adult"
    },
    "limit": 5
  }' | python3 -m json.tool

echo ""
echo ""
echo -e "${BLUE}✅ Test Suite Complete!${NC}"
echo ""
echo "To test with custom request:"
echo "  curl -X POST \"$API_ENDPOINT\" -H \"Content-Type: application/json\" -d @test-requests.json"
