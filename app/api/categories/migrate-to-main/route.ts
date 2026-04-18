import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import admin from "firebase-admin";

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const mainSnapshot = await db.collection("main_categories").get();
    const categorySnapshot = await db.collection("categories").get();
    const subcategorySnapshot = await db.collection("subcategories").get();

    const categories = categorySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];
    const subcategories = subcategorySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];

    const updates: Promise<any>[] = [];

    mainSnapshot.docs.forEach((mainDoc) => {
      const mainId = mainDoc.id;
      const childCategories = categories.filter((cat) => cat.mainCategoryId === mainId);
      const childrenNames = childCategories.map((cat) => cat.name).filter(Boolean);

      const subchildren: Record<string, string[]> = {};
      childCategories.forEach((cat) => {
        const subs = subcategories
          .filter((sub) => sub.categoryId === cat.id)
          .map((sub) => sub.name)
          .filter(Boolean);
        if (subs.length > 0) {
          subchildren[cat.name] = subs;
        }
      });

      updates.push(
        db.collection("main_categories").doc(mainId).update({
          children: childrenNames,
          subchildren,
          updatedAt: new Date().toISOString(),
        })
      );
    });

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: "Main categories updated with children/subchildren",
      mainCount: mainSnapshot.size,
    });
  } catch (error: any) {
    console.error("[Categories Migration] Error migrating to main:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to migrate to main_categories",
      },
      { status: 500 }
    );
  }
}
