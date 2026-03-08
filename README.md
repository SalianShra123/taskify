# Taskify

A beautiful, modern task manager built with vanilla JS and Firebase.

## Features
- 🔐 Authentication: Google Sign-In + Email/Password
- ☁️ Real-time Firestore sync (per-user tasks)
- ⭐ Priority tasks, inline editing, filters
- 🌙 Dark theme with orange accents
- 🚀 Deployed on Firebase Hosting

## Live App
👉 https://taskify-b2058.web.app

## Tech Stack
- HTML, CSS, Vanilla JS (ES Modules)
- Firebase Auth, Firestore, Hosting

## Setup
1. Clone the repo
2. Enable Email/Password and Google auth in [Firebase Console](https://console.firebase.google.com/project/taskify-b2058/authentication/providers)
3. Serve locally: `npx serve . -l 3000`
4. Deploy: `firebase deploy --only hosting`
