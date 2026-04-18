import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

// Debug endpoint to check Firebase Admin setup
export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {},
    errors: [],
  };

  // Check 1: permissions.json file exists
  try {
    const serviceAccountPath = path.join(process.cwd(), "permissions.json");
    const exists = fs.existsSync(serviceAccountPath);
    diagnostics.checks.permissionsFileExists = exists;
    diagnostics.checks.permissionsFilePath = serviceAccountPath;
    
    if (exists) {
      const fileContent = fs.readFileSync(serviceAccountPath, "utf8");
      const parsed = JSON.parse(fileContent);
      diagnostics.checks.hasPrivateKey = !!parsed.private_key;
      diagnostics.checks.hasClientEmail = !!parsed.client_email;
      diagnostics.checks.hasProjectId = !!parsed.project_id;
      diagnostics.checks.projectId = parsed.project_id;
    } else {
      diagnostics.errors.push("permissions.json file not found");
    }
  } catch (error: any) {
    diagnostics.errors.push(`Error checking permissions.json: ${error.message}`);
  }

  // Check 2: Try to import Firebase Admin
  try {
    const admin = await import("firebase-admin");
    diagnostics.checks.firebaseAdminInstalled = true;
    diagnostics.checks.firebaseAdminApps = admin.default.apps.length;
  } catch (error: any) {
    diagnostics.checks.firebaseAdminInstalled = false;
    diagnostics.errors.push(`Firebase Admin import error: ${error.message}`);
  }

  // Check 3: Try to initialize Firebase Admin
  try {
    const { db } = await import("@/lib/firebase-admin");
    diagnostics.checks.firestoreInitialized = !!db;
    
    if (db) {
      // Try a simple query
      const testQuery = db.collection("products").limit(1);
      await testQuery.get();
      diagnostics.checks.firestoreConnection = true;
    }
  } catch (error: any) {
    diagnostics.checks.firestoreInitialized = false;
    diagnostics.checks.firestoreConnection = false;
    diagnostics.errors.push(`Firestore initialization error: ${error.message}`);
    diagnostics.errors.push(`Error stack: ${error.stack}`);
  }

  // Check 4: Node.js version
  diagnostics.checks.nodeVersion = process.version;
  diagnostics.checks.platform = process.platform;
  diagnostics.checks.cwd = process.cwd();

  return NextResponse.json({
    success: diagnostics.errors.length === 0,
    diagnostics,
  });
}

