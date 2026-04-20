#!/bin/bash

# Kill ports if already in use
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "========================================="
echo "  صالون الحلاق - الإصدار الجديد (React)"
echo "========================================="

echo "جاري تشغيل السيرفر الخلفي (Backend)..."
source ~/.nvm/nvm.sh 2>/dev/null
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &

echo "جاري تشغيل واجهة المستخدم (Frontend)..."
cd frontend
npm run dev -- --open
