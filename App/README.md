# ChaiBreak Mobile App

React Native mobile application for ChaiBreak.

## Tech Stack

- React Native
- TypeScript
- React Query
- Zustand
- Axios
- AsyncStorage

---

## Project Structure

```txt
src/
├── screens/
├── services/
├── store/
```

---

## Prerequisites

- Node.js
- Android Studio
- Android SDK
- ADB
- Android Device or Emulator

---

## Installation

```bash
npm install
```

---

## Environment Variables

Create a `.env` file:

```env
API_URL=http://localhost:5000/api/v1
```

---

## Backend Setup

Start the backend first:

```bash
cd backend
npm run dev
```

Expected output:

```txt
Server running on port 5000
MySQL Connected
```

---

## Android Device Setup

For physical Android devices:

```bash
npm run tunnel
```

This executes:

```bash
adb reverse tcp:5000 tcp:5000
```

Verify:

```bash
adb reverse --list
```

Expected:

```txt
tcp:5000 tcp:5000
```

This allows the mobile app to access:

```txt
http://localhost:5000
```

without configuring local IP addresses.

---

## Running The App

Start Metro:

```bash
npm start
```

In another terminal:

```bash
npm run android
```

---

## Available Scripts

Start Metro:

```bash
npm start
```

Run Android app:

```bash
npm run android
```

Run iOS app:

```bash
npm run ios
```

---

## Authentication Flow

```txt
Login Screen -> Request OTP -> OTP Screen -> Verify OTP -> Store JWT -> Profile Screen
```

---

## Troubleshooting

### Could not connect to backend server

Ensure:

```bash
npm run tunnel
```

has been executed.

Verify:

```bash
adb reverse --list
```

contains:

```txt
tcp:5000 tcp:5000
```

Also confirm the backend server is running.

### OTP not received

Verify the backend terminal displays:

```txt
OTP Request for: XX******XX
Generated OTP:  XXXX
```

Use that OTP on the verification screen.
