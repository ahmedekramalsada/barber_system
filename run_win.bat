@echo off
chcp 65001 >nul
title צالون الحلاق - الإصدار الجديد (React)
color 0A

echo =========================================
echo   صالون الحلاق - الإصدار الجديد (React)
echo =========================================
echo.

echo [1/2] جاري تشغيل السيرفر الخلفي (Backend)...
start "Backend" cmd /c "python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000"

echo [2/2] جاري تشغيل واجهة المستخدم (Frontend)...
cd frontend
npm run dev -- --open
