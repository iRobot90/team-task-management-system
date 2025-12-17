#!/bin/bash

# Safe Deployment Verification Script
# Runs tests and builds locally to ensure stability before deployment.

set -e # Exit immediately if a command exits with a non-zero status.

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "Starting Pre-Deployment Verification..."

# 1. Backend Verification
print_status "Verifying Backend..."
cd backend
if [ ! -d "venv" ]; then
    print_error "Backend virtual environment not found. Please set it up first."
    exit 1
fi

source venv/bin/activate

print_status "Running Backend Tests..."
# Force SQLite for local testing to avoid permission issues
export USE_POSTGRES=False
python manage.py test
if [ $? -ne 0 ]; then
    print_error "Backend tests failed!"
    exit 1
fi

print_status "Checking for Python syntax errors..."
python -m compileall . -q
if [ $? -ne 0 ]; then
    print_error "Python syntax errors found!"
    exit 1
fi

deactivate
cd ..

# 2. Frontend Verification
print_status "Verifying Frontend..."
cd frontend

print_status "Running Frontend Tests..."
# CI=true forces the test runner to exit after running tests once (instead of watch mode)
CI=true npm test -- --passWithNoTests

if [ $? -ne 0 ]; then
    print_error "Frontend tests failed!"
    exit 1
fi

print_status "Attempting Frontend Build..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Frontend build failed! This would crash the deployment."
    exit 1
fi

cd ..

print_status "Verification Successful! Your changes are safe to deploy."
