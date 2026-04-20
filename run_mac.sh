#!/bin/bash

# Kill ports if already in use
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "========================================="
echo "  صالون الحلاق - الإصدار الجديد (React)"
echo "========================================="

echo "جاري فحص وتثبيت المتطلبات الخلفية (Python)..."
python3 -m pip install fastapi uvicorn --quiet

echo "جاري تشغيل السيرفر الخلفي (Backend)..."
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &

echo "جاري فحص المتطلبات الأمامية (Node)..."
source ~/.nvm/nvm.sh 2>/dev/null
export PATH=$PATH:/usr/local/bin
cd frontend
if [ ! -d "node_modules" ]; then
    echo "يتم تثبيت الواجهة للمرة الأولى (قد يستغرق دقيقة)..."
    npm install
fi

echo "جاري الإقلاع..."
npm run dev -- --open
 