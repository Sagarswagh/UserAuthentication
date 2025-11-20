#!/bin/bash
trap "kill 0" EXIT

echo "Starting Backend..."
cd backend
uvicorn main:app --reload --port 8000 &

echo "Starting Frontend..."
cd ../frontend
npm run dev &

wait
