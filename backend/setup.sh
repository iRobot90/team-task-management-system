#!/bin/bash

# Team Task Management System - Backend Setup Script

echo "Setting up TTMS Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "Please edit .env file with your database credentials"
    else
        echo "Warning: .env.example not found"
    fi
fi

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Initialize roles
echo "Initializing default roles..."
python manage.py init_roles

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your database credentials"
echo "2. Create PostgreSQL database: CREATE DATABASE ttms_db;"
echo "3. Run: python manage.py createsuperuser (optional)"
echo "4. Run: python manage.py runserver"
echo ""

