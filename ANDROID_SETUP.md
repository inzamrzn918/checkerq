# Android App Setup Guide

## Prerequisites
- Node.js and npm installed
- Expo CLI installed (`npm install -g expo-cli`)
- Android Studio (for emulator) or a physical Android device
- Backend server running

## Step 1: Find Your Local IP Address

The Android app needs to connect to your backend server using your computer's local IP address (not `localhost`).

### On Windows:
```powershell
ipconfig
```
Look for **IPv4 Address** under your active network adapter (WiFi or Ethernet).
It usually starts with `192.168.x.x` or `10.0.x.x`

### On Mac/Linux:
```bash
ifconfig
```
Look for **inet** address under your active network interface.

### Example Output:
```
IPv4 Address. . . . . . . . . . . : 192.168.31.12
```

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and replace `YOUR_LOCAL_IP` with your actual IP address:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.31.12:8000
   ```

3. (Optional) Add your Google OAuth credentials:
   ```env
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```

4. (Optional) Add your Gemini API key:
   ```env
   EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
   ```

## Step 3: Start the Backend Server

Make sure your backend server is running and accessible:

```bash
cd backend
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Mac/Linux

uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Important:** Use `--host 0.0.0.0` to make the server accessible from other devices on your network.

## Step 4: Start the Expo Development Server

```bash
npx expo start --clear
```

## Step 5: Run on Android

### Option A: Physical Device
1. Install Expo Go app from Google Play Store
2. Scan the QR code shown in the terminal
3. Make sure your phone is on the same WiFi network as your computer

### Option B: Android Emulator
1. Start Android Studio and launch an emulator
2. Press `a` in the Expo terminal to open the app in the emulator

## Troubleshooting

### Cannot connect to backend
- Verify your IP address is correct in `.env`
- Check that backend is running with `--host 0.0.0.0`
- Ensure your phone/emulator is on the same network
- Try pinging your computer from your phone: `ping 192.168.31.12`
- Check firewall settings - allow port 8000

### Google Sign-In not working
- Ensure you've added your Google OAuth credentials to `.env`
- Configure OAuth consent screen in Google Cloud Console
- Add your app's SHA-1 fingerprint to Google Cloud Console

### App crashes on startup
- Clear cache: `npx expo start --clear --reset-cache`
- Reinstall dependencies: `npm install`
- Check Expo terminal for error messages

### Environment variables not loading
- Restart Expo dev server after changing `.env`
- Ensure variables start with `EXPO_PUBLIC_`
- Check for syntax errors in `.env` file

## Testing the Connection

Once the app is running, you can test the API connection:

1. Open the app
2. Check the console/logs for API connection errors
3. Try signing in (if Google OAuth is configured)
4. Navigate through the app to ensure data loads

## Network Configuration

### Same WiFi Network
Both your development machine and Android device must be on the same WiFi network.

### Firewall Rules
If you have firewall issues, allow incoming connections on port 8000:

**Windows Firewall:**
```powershell
netsh advfirewall firewall add rule name="Expo Backend" dir=in action=allow protocol=TCP localport=8000
```

**Mac:**
System Preferences → Security & Privacy → Firewall → Firewall Options → Add uvicorn

## Production Build

For production builds, update the API URL to your production server:

```env
EXPO_PUBLIC_API_URL=https://your-production-api.com
```

Then build the APK:
```bash
npm run build:android
```
