#!/bin/bash
set -e
# backend deps
cd /workspaces/$GITHUB_REPOSITORY/backend || cd backend
if [ -f package-lock.json ]; then npm ci; else npm install; fi
# frontend deps
cd /workspaces/$GITHUB_REPOSITORY/frontend || cd frontend
if [ -f package-lock.json ]; then npm ci; else npm install; fi
# create data dirs if missing
mkdir -p /workspaces/$GITHUB_REPOSITORY/backend/data/npcs
mkdir -p /workspaces/$GITHUB_REPOSITORY/backend/data