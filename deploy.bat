@echo off
REM WhatsApp Automation Deployment Script for Windows
REM This script helps deploy the application to Render (backend) and Vercel (frontend)

echo 🚀 WhatsApp Automation Deployment Helper
echo =========================================

REM Check if git is available
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed. Please install Git first.
    pause
    exit /b 1
)

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo ❌ This is not a Git repository. Please initialize Git first:
    echo    git init
    echo    git add .
    echo    git commit -m "Initial commit"
    echo    git remote add origin ^<your-repo-url^>
    pause
    exit /b 1
)

echo ✅ Git repository detected

REM Check for required files
echo 🔍 Checking required files...

if not exist "render.yaml" (
    echo ❌ render.yaml not found
    pause
    exit /b 1
)

if not exist "frontend\vercel.json" (
    echo ❌ frontend\vercel.json not found
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ❌ frontend\package.json not found
    pause
    exit /b 1
)

if not exist "backend\package.json" (
    echo ❌ backend\package.json not found
    pause
    exit /b 1
)

echo ✅ All required files found

REM Check for environment variables
echo 🔍 Checking environment variables...

if not exist ".env" (
    echo ⚠️  .env file not found. Make sure to set environment variables in your deployment platforms.
) else (
    echo ✅ .env file found ^(remember not to commit this to Git^)
)

echo.
echo 📋 Deployment Checklist:
echo ========================
echo.
echo Backend ^(Render^):
echo 1. ✅ render.yaml configured
echo 2. 🔲 Push code to GitHub
echo 3. 🔲 Connect GitHub repo to Render
echo 4. 🔲 Set environment variables in Render:
echo    - MISTRAL_API_KEY
echo    - JWT_SECRET
echo    - FRONTEND_URL ^(will be set after frontend deployment^)
echo.
echo Frontend ^(Vercel^):
echo 1. ✅ vercel.json configured
echo 2. 🔲 Deploy to Vercel
echo 3. 🔲 Set environment variable in Vercel:
echo    - VITE_API_URL ^(your Render backend URL^)
echo.
echo Post-deployment:
echo 1. 🔲 Update FRONTEND_URL in Render with your Vercel URL
echo 2. 🔲 Test the application
echo.

REM Offer to commit and push changes
set /p response="Would you like to commit and push your changes to Git? (y/n): "

if /i "%response%"=="y" (
    echo 📝 Committing changes...
    git add .
    git commit -m "Configure deployment for Render and Vercel"
    
    echo 📤 Pushing to remote repository...
    git push
    
    if errorlevel 0 (
        echo ✅ Changes pushed successfully!
        echo.
        echo 🎉 Next steps:
        echo 1. Go to https://render.com and create a new Web Service
        echo 2. Connect your GitHub repository
        echo 3. Set the required environment variables
        echo 4. Deploy your backend
        echo 5. Go to https://vercel.com and deploy your frontend
        echo 6. Set VITE_API_URL to your Render backend URL
        echo 7. Update FRONTEND_URL in Render to your Vercel URL
    ) else (
        echo ❌ Failed to push changes. Please check your Git configuration.
    )
) else (
    echo ⏭️  Skipping Git operations. Remember to commit and push your changes manually.
)

echo.
echo 📖 For detailed instructions, see DEPLOYMENT.md
pause
