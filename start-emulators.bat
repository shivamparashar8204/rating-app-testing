@echo off
cd /d "D:\programs\5-star-rating\rating-app-testing"
echo Starting Firebase emulators...
firebase emulators:start --only firestore,auth --project star-rating-83004
