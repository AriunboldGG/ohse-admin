const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const content = fs.readFileSync(filePath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    if (!line || line.trim().startsWith("#")) return;
    const idx = line.indexOf("=");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
};

loadEnvFile(path.join(process.cwd(), ".env.local"));

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY in env.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

async function run() {
  const mainSnapshot = await db.collection("main_categories").get();
  const categorySnapshot = await db.collection("categories").get();
  const subcategorySnapshot = await db.collection("subcategories").get();

  const categories = categorySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const subcategories = subcategorySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const updates = mainSnapshot.docs.map(async (mainDoc) => {
    const mainId = mainDoc.id;
    const childCategories = categories.filter((cat) => cat.mainCategoryId === mainId);
    const childrenNames = childCategories.map((cat) => cat.name).filter(Boolean);

    const subchildren = {};
    childCategories.forEach((cat) => {
      const subs = subcategories
        .filter((sub) => sub.categoryId === cat.id)
        .map((sub) => sub.name)
        .filter(Boolean);
      if (subs.length > 0) {
        subchildren[cat.name] = subs;
      }
    });

    await db.collection("main_categories").doc(mainId).update({
      children: childrenNames,
      subchildren,
      updatedAt: new Date().toISOString(),
    });
  });

  await Promise.all(updates);
  console.log("Migration to main_categories completed.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
