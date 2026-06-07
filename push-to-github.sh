#!/bin/bash
# Run this from inside the exam-platform/ folder
# This pushes your code to GitHub so Vercel can detect vercel.json

# ── Step 1: Initialize git (skip if already done) ─────────────
git init
git branch -M main

# ── Step 2: Add your GitHub remote ────────────────────────────
# Replace with YOUR actual GitHub repo URL
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# ── Step 3: Stage everything ───────────────────────────────────
git add .

# ── Step 4: Check what's being committed ───────────────────────
echo ""
echo "Files being committed:"
git status --short
echo ""

# ── Step 5: Commit ────────────────────────────────────────────
git commit -m "feat: full-stack ExamEdge platform with Vercel monorepo config"

# ── Step 6: Push ──────────────────────────────────────────────
git push -u origin main

echo ""
echo "✅ Done! Now go to Vercel and:"
echo "   1. New Project → Import your GitHub repo"
echo "   2. Vercel will auto-detect vercel.json with experimentalServices"
echo "   3. Add environment variables (see DEPLOYMENT.md)"
