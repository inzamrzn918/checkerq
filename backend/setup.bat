@echo off
echo ========================================
echo CheckerQ Backend Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.11 or higher
    pause
    exit /b 1
)

echo [1/5] Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)

echo [2/5] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/5] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [4/5] Creating .env file...
if not exist .env (
    copy .env.example .env
    echo Created .env file. Please edit it with your configuration.
) else (
    echo .env file already exists.
)

echo [5/5] Creating uploads directory...
if not exist uploads mkdir uploads

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env file with your configuration
echo 2. Start PostgreSQL and Redis (or run: docker-compose up -d postgres redis)
echo 3. Run the server: uvicorn app.main:app --reload
echo.
echo API will be available at: http://localhost:8000
echo API docs at: http://localhost:8000/docs
echo.
pause
