@echo off
REM Helper script to create a new release

if "%1"=="" (
    echo Usage: release.bat [major^|minor^|patch]
    echo Example: release.bat patch
    exit /b 1
)

echo Bumping %1 version...
call npm version %1 --no-git-tag-version

echo.
echo Reading new version...
for /f "tokens=*" %%i in ('node -p "require(\"./package.json\").version"') do set VERSION=%%i

echo New version: %VERSION%

echo.
echo Committing version bump...
git add package.json package-lock.json
git commit -m "Bump version to %VERSION%"

echo.
echo Creating tag v%VERSION%...
git tag v%VERSION%

echo.
echo ==========================================
echo Release v%VERSION% prepared!
echo ==========================================
echo.
echo Next steps:
echo 1. Build APK: npm run build:android (or use EAS cloud build)
echo 2. Move APK to release folder: move Downloads\build-*.apk release\CheckerQ.apk
echo 3. Commit APK: git add release\CheckerQ.apk ^&^& git commit -m "Add v%VERSION% APK"
echo 4. Push: git push origin master --tags
echo.
echo The GitHub Action will automatically create the release!
