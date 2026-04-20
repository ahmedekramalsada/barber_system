@echo off
chcp 65001 >nul
title نظام صالون الحلاق - الكاشير
color 0B

echo ========================================================
echo          نظام إدارة صالون الحلاق - الذكي المطور (React)
echo ========================================================
echo.

:: 1. Check Python
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [!] لم يتم العثور على بايثون (Python).
    echo جاري التنزيل والتثبيت تلقائيا... (يستغرق بضعة دقائق، يرجى الانتظار)
    winget install Python.Python.3.11 --accept-source-agreements --accept-package-agreements --silent --force
    echo.
    echo [!] تم تثبيت بايثون بنجاح! 
    echo يرجى إغلاق هذه النافذة (علامة X) وفتح هذا الملف مرة أخرى لاكتمال التشغيل!
    pause
    exit
)

:: 2. Check Node.js
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [!] لم يتم العثور على Node.js.
    echo جاري التنزيل والتثبيت تلقائيا... (يستغرق بضعة دقائق)
    winget install OpenJS.NodeJS --accept-source-agreements --accept-package-agreements --silent --force
    echo.
    echo [!] تم تثبيت Node.js بنجاح! 
    echo يرجى إغلاق هذه النافذة (علامة X) وفتح هذا الملف مرة أخرى لاكتمال التشغيل!
    pause
    exit
)

:: 3. Check and install backend dependencies
echo [1/3] فحص السيرفر الخلفي وقواعد البيانات...
python -m pip install fastapi uvicorn >nul 2>&1

:: 4. Check and install frontend dependencies
echo [2/3] فحص واجهة المستخدم (لنقطة البيع)...
cd frontend
if not exist "node_modules\" (
    echo         جاري إعداد واجهة المستخدم للمرة الأولى (قد يستغرق دقيقة)...
    call npm install >nul 2>&1
)

:: 5. START SYSTEM
echo [3/3] النظام جاهز وسريع جداً! جاري الإقلاع...
start "Barber Backend Server" cmd /c "cd .. && python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000"
start "Barber Frontend Browser" cmd /c "npm run dev -- --open"

echo.
echo ==========================================
echo تم التشغيل بنجاح! المتصفح يفتح الآن تلقائياً...
echo (تنبيه هام: اترك النوافذ السوداء تعمل في الخلفية أثناء العمل على البرنامج)
echo ==========================================
pause >nul
