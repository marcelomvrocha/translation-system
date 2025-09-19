#!/bin/bash

# Setup GitHub Repository Script
# This script helps you create and push your translation system to GitHub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Translation System GitHub Setup${NC}"
echo "=================================="

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) is not installed.${NC}"
    echo "Please install it first: https://cli.github.com/"
    echo ""
    echo "Alternative: Create the repository manually on GitHub and run:"
    echo "git remote add origin https://github.com/YOUR_USERNAME/translation-system.git"
    echo "git push -u origin main"
    exit 1
fi

# Check if user is logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  You're not logged in to GitHub CLI.${NC}"
    echo "Please log in first: gh auth login"
    exit 1
fi

# Get repository name
REPO_NAME="translation-system"
echo -e "${BLUE}Repository name: ${REPO_NAME}${NC}"

# Check if repository already exists
if gh repo view "$REPO_NAME" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Repository '$REPO_NAME' already exists.${NC}"
    read -p "Do you want to continue with pushing to existing repo? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    # Create repository
    echo -e "${GREEN}📦 Creating GitHub repository...${NC}"
    gh repo create "$REPO_NAME" \
        --public \
        --description "A modern, collaborative translation management system with AI integration capabilities" \
        --add-readme=false
fi

# Add remote origin
echo -e "${GREEN}🔗 Adding remote origin...${NC}"
git remote add origin "https://github.com/$(gh api user --jq .login)/$REPO_NAME.git" 2>/dev/null || \
git remote set-url origin "https://github.com/$(gh api user --jq .login)/$REPO_NAME.git"

# Push to GitHub
echo -e "${GREEN}📤 Pushing to GitHub...${NC}"
git push -u origin main

echo ""
echo -e "${GREEN}✅ Successfully created and pushed to GitHub!${NC}"
echo ""
echo -e "${BLUE}🔗 Repository URL:${NC} https://github.com/$(gh api user --jq .login)/$REPO_NAME"
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Update the repository URL in package.json files"
echo "2. Set up GitHub Actions for CI/CD"
echo "3. Configure branch protection rules"
echo "4. Set up issue and PR templates"
echo ""
echo -e "${GREEN}🎉 Your translation system is now on GitHub!${NC}"
