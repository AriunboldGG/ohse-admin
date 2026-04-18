import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth"

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Validate required config values
const missingVars: string[] = []
if (!firebaseConfig.apiKey) missingVars.push("NEXT_PUBLIC_FIREBASE_API_KEY")
if (!firebaseConfig.authDomain) missingVars.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN")
if (!firebaseConfig.projectId) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID")

if (missingVars.length > 0) {
  if (typeof window === "undefined") {
    // Server-side: log warning but don't throw (for build time)
    console.warn(
      `[Firebase] Missing required environment variables: ${missingVars.join(", ")}. ` +
      "Please check your .env.local file."
    )
  } else {
    // Client-side: log error
    console.error(
      `[Firebase] Missing required Firebase configuration: ${missingVars.join(", ")}. ` +
      "Please check your .env.local file."
    )
  }
} else {
  // Log successful configuration (without sensitive data)
  if (typeof window !== "undefined") {
    console.log(
      `[Firebase] Configuration loaded successfully for project: ${firebaseConfig.projectId}`
    )
  }
}

// Initialize Firebase (only if not already initialized)
let app: FirebaseApp
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig)
  } catch (error) {
    console.error("[Firebase] Error initializing Firebase:", error)
    throw error
  }
} else {
  app = getApps()[0]
}

// Initialize Firebase Auth
export const auth: Auth = getAuth(app)

// Connect to emulator in development if needed
if (
  typeof window !== "undefined" &&
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"
) {
  try {
    // Check if emulator is already connected
    const authConfig = (auth as any)._delegate?._config
    if (!authConfig?.emulator) {
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true })
      console.log("[Firebase] Connected to Auth Emulator")
    }
  } catch (error) {
    console.warn("[Firebase] Could not connect to Auth Emulator:", error)
  }
}

export default app
