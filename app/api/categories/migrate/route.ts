import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { categories } from "@/lib/categories";

// POST - Migrate static categories to Firebase
export async function POST(request: NextRequest) {
  try {
    console.log("[Categories Migration] Starting migration...");
    
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const mainCategoryIds: Record<string, string> = {}; // Map old ID to new Firestore ID
    const categoryIds: Record<string, string> = {}; // Map old ID to new Firestore ID

    // Step 1: Create main categories
    for (const mainCat of categories) {
      const mainCategoryData = {
        name: mainCat.name,
        nameEn: mainCat.nameEn || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Check if main category already exists by name
      const existingMain = await db.collection("main_categories")
        .where("name", "==", mainCat.name)
        .limit(1)
        .get();

      let mainCategoryDocId: string;
      if (!existingMain.empty) {
        mainCategoryDocId = existingMain.docs[0].id;
        // Update existing
        await db.collection("main_categories").doc(mainCategoryDocId).update({
          ...mainCategoryData,
          updatedAt: new Date().toISOString(),
        });
        console.log(`[Categories Migration] Updated main category: ${mainCat.name}`);
      } else {
        // Create new
        const docRef = await db.collection("main_categories").add(mainCategoryData);
        mainCategoryDocId = docRef.id;
        console.log(`[Categories Migration] Created main category: ${mainCat.name}`);
      }
      
      mainCategoryIds[mainCat.id] = mainCategoryDocId;

      // Step 2: Create categories (second level)
      if (mainCat.children) {
        for (const category of mainCat.children) {
          const categoryData = {
            name: category.name,
            nameEn: category.nameEn || "",
            mainCategoryId: mainCategoryDocId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Check if category already exists by name and mainCategoryId
          const existingCategory = await db.collection("categories")
            .where("name", "==", category.name)
            .where("mainCategoryId", "==", mainCategoryDocId)
            .limit(1)
            .get();

          let categoryDocId: string;
          if (!existingCategory.empty) {
            categoryDocId = existingCategory.docs[0].id;
            // Update existing
            await db.collection("categories").doc(categoryDocId).update({
              ...categoryData,
              updatedAt: new Date().toISOString(),
            });
            console.log(`[Categories Migration] Updated category: ${category.name}`);
          } else {
            // Create new
            const docRef = await db.collection("categories").add(categoryData);
            categoryDocId = docRef.id;
            console.log(`[Categories Migration] Created category: ${category.name}`);
          }
          
          categoryIds[category.id] = categoryDocId;

          // Step 3: Create subcategories (third level)
          if (category.children) {
            for (const subcategory of category.children) {
              const subcategoryData = {
                name: subcategory.name,
                nameEn: subcategory.nameEn || "",
                categoryId: categoryDocId,
                mainCategoryId: mainCategoryDocId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              // Check if subcategory already exists by name and categoryId
              const existingSubcategory = await db.collection("subcategories")
                .where("name", "==", subcategory.name)
                .where("categoryId", "==", categoryDocId)
                .limit(1)
                .get();

              if (!existingSubcategory.empty) {
                // Update existing
                await db.collection("subcategories").doc(existingSubcategory.docs[0].id).update({
                  ...subcategoryData,
                  updatedAt: new Date().toISOString(),
                });
                console.log(`[Categories Migration] Updated subcategory: ${subcategory.name}`);
              } else {
                // Create new
                await db.collection("subcategories").add(subcategoryData);
                console.log(`[Categories Migration] Created subcategory: ${subcategory.name}`);
              }
            }
          }
        }
      }
    }

    console.log("[Categories Migration] Migration completed successfully");

    return NextResponse.json({
      success: true,
      message: "Categories migrated successfully",
      mainCategoriesCount: Object.keys(mainCategoryIds).length,
    });
  } catch (error: any) {
    console.error("[Categories Migration] Error migrating categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to migrate categories",
      },
      { status: 500 }
    );
  }
}
