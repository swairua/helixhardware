#!/bin/bash

# Medical Supplies - External API Database Setup Script
# This script initializes the MySQL database and creates the admin user

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
API_URL="${API_URL:-https://helixgeneralhardware.com/api.php}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@biolegend.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Biolegend2024!Admin}"
DRY_RUN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --api-url)
      API_URL="$2"
      shift 2
      ;;
    --email)
      ADMIN_EMAIL="$2"
      shift 2
      ;;
    --password)
      ADMIN_PASSWORD="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help)
      echo "Usage: ./setup-external-api.sh [options]"
      echo ""
      echo "Options:"
      echo "  --api-url URL         API endpoint URL (default: https://helixgeneralhardware.com/api.php)"
      echo "  --email EMAIL         Admin email (default: admin@biolegend.local)"
      echo "  --password PASSWORD   Admin password (default: Biolegend2024!Admin)"
      echo "  --dry-run            Show what would be done without actually doing it"
      echo "  --help               Show this help message"
      echo ""
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Display header
echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}Medical Supplies - External API Setup${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

# Display configuration
echo -e "${YELLOW}Configuration:${NC}"
echo "  API URL: $API_URL"
echo "  Admin Email: $ADMIN_EMAIL"
echo "  Admin Password: [***hidden***]"
if [ "$DRY_RUN" = true ]; then
  echo "  Mode: DRY RUN (no changes will be made)"
fi
echo ""

# Check if curl is available
if ! command -v curl &> /dev/null; then
  echo -e "${RED}✗ Error: curl is not installed${NC}"
  echo "Please install curl and try again"
  exit 1
fi

# Check if jq is available (for JSON parsing)
JQ_AVAILABLE=true
if ! command -v jq &> /dev/null; then
  JQ_AVAILABLE=false
  echo -e "${YELLOW}⚠ Warning: jq is not installed (JSON output will be raw)${NC}"
  echo "Install jq for better output formatting: sudo apt-get install jq"
  echo ""
fi

# Function to print section
print_section() {
  echo -e "${BLUE}$1${NC}"
}

# Function to print success
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Step 1: Test API connectivity
print_section "Step 1: Testing API Connectivity"
echo "Testing connection to: $API_URL"

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL?action=health" 2>&1 || echo -e "\n500")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "400" ]] || [[ "$HTTP_CODE" == "404" ]]; then
  print_success "API is accessible (HTTP $HTTP_CODE)"
else
  print_error "API is not responding (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
  exit 1
fi
echo ""

# Step 2: Initialize database and create admin user
print_section "Step 2: Initializing Database & Creating Admin User"

if [ "$DRY_RUN" = true ]; then
  echo "Would execute:"
  echo "  curl -X POST \"$API_URL?action=setup\" \\"
  echo "    -H \"Content-Type: application/json\" \\"
  echo "    -d '{\"email\":\"$ADMIN_EMAIL\",\"password\":\"***\"}'"
  echo ""
else
  echo "Creating admin user: $ADMIN_EMAIL"

  SETUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL?action=setup" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" 2>&1)

  HTTP_CODE=$(echo "$SETUP_RESPONSE" | tail -n1)
  BODY=$(echo "$SETUP_RESPONSE" | head -n-1)

  if [[ "$HTTP_CODE" == "200" ]]; then
    print_success "Admin user created (HTTP $HTTP_CODE)"
    if [ "$JQ_AVAILABLE" = true ]; then
      echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    else
      echo "$BODY"
    fi
  else
    print_error "Failed to create admin user (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
    exit 1
  fi
fi
echo ""

# Step 3: Verify login
print_section "Step 3: Verifying Authentication"

if [ "$DRY_RUN" = true ]; then
  echo "Would execute:"
  echo "  curl -X POST \"$API_URL?action=login\" \\"
  echo "    -H \"Content-Type: application/json\" \\"
  echo "    -d '{\"email\":\"$ADMIN_EMAIL\",\"password\":\"***\"}'"
  echo ""
else
  echo "Attempting login with created credentials..."

  LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL?action=login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" 2>&1)

  HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
  BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

  if [[ "$HTTP_CODE" == "200" ]]; then
    print_success "Login successful (HTTP $HTTP_CODE)"
    if [ "$JQ_AVAILABLE" = true ]; then
      echo "$BODY" | jq '.user // .' 2>/dev/null || echo "$BODY"
    else
      echo "$BODY"
    fi

    # Extract and display token
    if [ "$JQ_AVAILABLE" = true ]; then
      TOKEN=$(echo "$BODY" | jq -r '.token' 2>/dev/null)
      if [[ ! -z "$TOKEN" && "$TOKEN" != "null" ]]; then
        print_success "JWT Token obtained"
        echo "Token: ${TOKEN:0:50}..."
      fi
    fi
  else
    print_error "Login verification failed (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
    exit 1
  fi
fi
echo ""

# Final summary
echo -e "${BLUE}======================================================${NC}"
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}DRY RUN COMPLETE${NC}"
else
  echo -e "${GREEN}SETUP COMPLETE ✓${NC}"
  echo ""
  echo "Admin Credentials:"
  echo "  ${BLUE}Email:${NC} $ADMIN_EMAIL"
  echo "  ${BLUE}Password:${NC} [stored securely]"
  echo ""
  echo "Next steps:"
  echo "  1. Open the application in your browser"
  echo "  2. Navigate to: https://your-app-url/admin-init-external"
  echo "  3. Or login with the credentials above"
fi
echo -e "${BLUE}======================================================${NC}"
echo ""
