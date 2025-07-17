# Firebase & OAuth Setup Instructions

## Firebase Setup

1. **Go to Firebase Console**
   - Visit [Firebase Console](https://console.firebase.google.com)
   - Your project ID is already configured: `gst-invoice-4fac4`

2. **Enable Firestore Database**
   - Go to Firestore Database in the Firebase console
   - Click "Create database"
   - Choose "Start in test mode" for development
   - Select a location close to your users

3. **Enable Authentication**
   - Go to Authentication > Sign-in method
   - Enable "Google" provider
   - Add your domain (localhost:3000 for development)

## Google OAuth Setup

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com)
   - Select your project or create a new one

2. **Enable Google+ API**
   - Go to APIs & Services > Library
   - Search for "Google+ API" and enable it

3. **Create OAuth Credentials**
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized origins: `http://localhost:3000`
   - Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

4. **Copy Credentials**
   - Copy the Client ID and Client Secret
   - Update your `.env.local` file:

```bash
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
```

## NextAuth Secret

Generate a random secret for NextAuth:

```bash
openssl rand -base64 32
```

Update your `.env.local`:
```bash
NEXTAUTH_SECRET=your-generated-secret
```

## Firebase Admin Setup (for NextAuth Firebase Adapter)

1. **Create Service Account**
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Extract Values**
   - From the downloaded JSON, copy:
     - `client_email`
     - `private_key`

3. **Update Environment Variables**
```bash
FIREBASE_CLIENT_EMAIL=your-service-account-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----\n"
```

## Test the Application

1. Start the development server: `npm run dev`
2. Visit `http://localhost:3000`
3. Click "Sign in with Google" in the top navigation
4. Create an invoice and it should be saved to your Firebase database
5. View your saved invoices in the "Your Invoices" section

## Firestore Security Rules (Optional)

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own invoices
    match /invoices/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // NextAuth required collections
    match /users/{document} {
      allow read, write: if request.auth != null && request.auth.uid == document;
    }
    match /accounts/{document} {
      allow read, write: if request.auth != null;
    }
    match /sessions/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Features Implemented

✅ Firebase Authentication with Google OAuth
✅ Invoice storage in Firestore
✅ User-specific invoice lists
✅ Automatic invoice saving when generating
✅ Responsive design for mobile
✅ Invoice PDF/PNG download
✅ Real-time invoice list updates
