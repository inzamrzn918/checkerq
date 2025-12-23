@echo off
echo ==========================================
echo Starting CheckerQ Local Android Build
echo ==========================================

echo Setting JAVA_HOME...
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
echo JAVA_HOME set to: %JAVA_HOME%

echo Setting ANDROID_HOME...
set "ANDROID_HOME=C:\Users\inzam\AppData\Local\Android\Sdk"
echo ANDROID_HOME set to: %ANDROID_HOME%

if not exist release (
    echo Creating release directory...
    mkdir release
)

echo.
echo Navigating to android directory...
cd android

echo.
echo Running Gradle Clean...
call gradlew.bat clean

echo.
echo Creating Assest Directory...
if not exist app\src\main\assets mkdir app\src\main\assets

echo.
echo Manual Bundling JS...
cd ..
call npx react-native bundle --platform android --dev false --entry-file index.ts --bundle-output android\app\src\main\assets\index.android.bundle --assets-dest android\app\src\main\res
cd android

echo.
echo Running Gradle AssembleRelease...
call gradlew.bat assembleRelease

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Gradle Build Failed with exit code %ERRORLEVEL%
    cd ..
    exit /b %ERRORLEVEL%
)

cd ..
echo.
echo Gradle Build Successful!

echo.
echo Copying APK to release folder...
if exist android\app\build\outputs\apk\release\app-release.apk (
    copy android\app\build\outputs\apk\release\app-release.apk release\CheckerQ.apk
    echo.
    echo [SUCCESS] APK generated at: release\CheckerQ.apk
) else (
    echo.
    echo [ERROR] APK file not found at expected path: android\app\build\outputs\apk\release\app-release.apk
    exit /b 1
)
