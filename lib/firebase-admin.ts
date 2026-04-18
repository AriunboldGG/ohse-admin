import admin from "firebase-admin";

let db: admin.firestore.Firestore | null = null;
let initializationAttempted = false;

// Initialize Firebase Admin (lazy initialization)
function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Skip initialization during build time
  if (process.env.NEXT_PHASE === "phase-production-build") {
    console.warn("Skipping Firebase Admin initialization during build");
    return null;
  }

  try {
    // Use environment variables from .env.local (preferred method)
    // All sensitive data MUST come from environment variables
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Check if all required environment variables are set
    const missingVars = [];
    if (!projectId) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    if (!clientEmail) missingVars.push("FIREBASE_CLIENT_EMAIL");
    if (!privateKey) missingVars.push("FIREBASE_PRIVATE_KEY");
    
    if (missingVars.length > 0) {
      const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1" || !!process.env.VERCEL;
      
      if (isProduction) {
        console.error(`[Firebase Admin] Missing required environment variables in production: ${missingVars.join(", ")}`);
        console.error("[Firebase Admin] Please set these in your deployment platform (Vercel, etc.)");
        throw new Error(`Missing required environment variables: ${missingVars.join(", ")}. Please configure them in your production environment.`);
      }
      
      // In development, provide clear error message about .env.local
      let errorMessage = `Firebase Admin SDK initialization failed. Missing required environment variables in .env.local: ${missingVars.join(", ")}\n\n`;
      errorMessage += `To fix this, add these to your .env.local file:\n`;
      errorMessage += `NEXT_PUBLIC_FIREBASE_PROJECT_ID=${projectId || "your-project-id"}\n`;
      errorMessage += `FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com\n`;
      errorMessage += `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour private key here\\n-----END PRIVATE KEY-----\\n"\n\n`;
      errorMessage += `To get these values:\n`;
      errorMessage += `1. Go to Firebase Console > Project Settings > Service Accounts\n`;
      errorMessage += `2. Click "Generate New Private Key" to download the JSON file\n`;
      errorMessage += `3. Copy the values from the JSON:\n`;
      errorMessage += `   - project_id → NEXT_PUBLIC_FIREBASE_PROJECT_ID\n`;
      errorMessage += `   - client_email → FIREBASE_CLIENT_EMAIL\n`;
      errorMessage += `   - private_key → FIREBASE_PRIVATE_KEY (keep the quotes and \\n characters)`;
      
      throw new Error(errorMessage);
    }

    // All required environment variables are present - initialize Firebase Admin
    const serviceAccount = {
      projectId: projectId!,
      clientEmail: clientEmail!,
      privateKey: privateKey!.replace(/\\n/g, "\n"), // Replace escaped newlines with actual newlines
    };

    // Use explicit bucket name from env, or construct from project ID
    // Default to new Firebase Storage format: projectId.firebasestorage.app
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;

    console.log(`[Firebase Admin] Initializing with project: ${projectId}, bucket: ${storageBucket}`);
    console.log(`[Firebase Admin] Using credentials from .env.local`);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      storageBucket: storageBucket,
    });

    console.log("[Firebase Admin] Initialized successfully from environment variables");
    return admin.app();
  } catch (error: any) {
    console.error("Error initializing Firebase Admin:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    // Don't throw during build - return null instead
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn("Firebase Admin initialization failed during build, will retry at runtime");
      return null;
    }
    throw new Error(`Failed to initialize Firebase Admin: ${error?.message || "Unknown error"}`);
  }
}

// Lazy getter for Firestore instance - only initializes when actually accessed
function getDb(): admin.firestore.Firestore {
  if (db) {
    return db;
  }

  // Mark that we've attempted initialization
  initializationAttempted = true;

  const app = initializeFirebase();
  if (!app) {
    throw new Error("Firebase Admin not initialized. Make sure permissions.json exists or environment variables are set.");
  }

  db = app.firestore();
  return db;
}

// Export db as a Proxy that initializes on first property access
// This allows the same API (db.collection()) while being lazy
const dbProxy = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    const firestore = getDb();
    const value = (firestore as any)[prop];
    if (typeof value === 'function') {
      return value.bind(firestore);
    }
    return value;
  }
});

// Helper function to get Storage bucket
export function getStorageBucket() {
  const app = initializeFirebase();
  if (!app) {
    throw new Error("Firebase Admin not initialized. Make sure permissions.json exists or environment variables are set.");
  }
  
  const storage = admin.storage();
  
  // Get bucket name from app options (set during initialization)
  let bucketName = app.options.storageBucket;
  
  if (!bucketName) {
    // Try multiple sources for project ID
    let projectId: string | undefined;
    
    // 1. Try from environment variable
    projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    // 2. Try from app options
    if (!projectId) {
      projectId = app.options.projectId;
    }
    
    // 3. Try to extract from credential (if it's a cert credential)
    if (!projectId && app.options.credential) {
      const cred = app.options.credential as any;
      if (cred && typeof cred.getAccessToken === 'function') {
        // Try to get project ID from credential
        try {
          // For cert credentials, we can check the internal projectId
          if (cred.projectId) {
            projectId = cred.projectId;
          }
        } catch (e) {
          // Ignore errors
        }
      }
    }
    
    if (!projectId) {
      console.error("Debug info:", {
        envProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        appProjectId: app.options.projectId,
        appStorageBucket: app.options.storageBucket,
        hasCredential: !!app.options.credential,
      });
      throw new Error(
        "Cannot determine storage bucket: projectId is undefined. " +
        "Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID in your .env.local file."
      );
    }
    
    // Default to new Firebase Storage format: projectId.firebasestorage.app
    bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;
    console.warn(`Storage bucket not found in app options, using fallback: ${bucketName} (projectId: ${projectId})`);
  }
  
  console.log(`Using storage bucket: ${bucketName}`);
  return storage.bucket(bucketName);
}

export { dbProxy as db };
export default admin;


