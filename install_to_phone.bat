@echo off
echo ========================================================
echo Installing Frontier Defense to connected Android device
echo ========================================================
C:\adb\adb.exe install -r apk\FrontierDefense.apk
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Installation successful! Launching app...
    C:\adb\adb.exe shell am start -n com.frontiertd.game/.MainActivity
) else (
    echo.
    echo Installation failed. Please ensure your phone is connected via USB with USB Debugging enabled.
)
pause
