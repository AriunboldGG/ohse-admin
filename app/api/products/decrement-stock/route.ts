import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import admin from "firebase-admin";

type DecrementItem = {
  productId?: string;
  productCode?: string;
  quantity: number;
};

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const body = await request.json();
    const items: DecrementItem[] = Array.isArray(body?.items) ? body.items : [];

    const normalizedItems = items
      .map((item) => ({
        productId: String(item.productId || "").trim(),
        productCode: String(item.productCode || "").trim(),
        quantity: Number(item.quantity || 0),
      }))
      .filter((item) => (item.productId || item.productCode) && item.quantity > 0);

    if (normalizedItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid items provided" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const missing: string[] = [];
    const matched: string[] = [];
    let updatedCount = 0;

    await db.runTransaction(async (transaction) => {
      for (const item of normalizedItems) {
        let productRef = null as any;
        let productSnap = null as any;

        if (item.productId) {
          productRef = db.collection("products").doc(item.productId);
          productSnap = await transaction.get(productRef);
        }

        if ((!productSnap || !productSnap.exists) && item.productCode) {
          const querySnap = await db
            .collection("products")
            .where("product_code", "==", item.productCode)
            .limit(1)
            .get();
          if (!querySnap.empty) {
            productRef = querySnap.docs[0].ref;
            productSnap = querySnap.docs[0];
          }
        }

        if (!productSnap || !productSnap.exists) {
          missing.push(item.productId || item.productCode || "unknown");
          continue;
        }

        const data = productSnap.data() || {};
        const currentStock = Number(data.stock ?? 0);
        const nextStock = Math.max(0, currentStock - item.quantity);

        transaction.update(productRef, {
          stock: nextStock,
          updatedAt: now,
        });
        matched.push(productRef.id);
        updatedCount += 1;
      }
    });

    return NextResponse.json({
      success: true,
      count: updatedCount,
      matched,
      missing,
    });
  } catch (error: any) {
    console.error("[Products API] Error decrementing stock:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to decrement stock",
        code: error?.code,
      },
      { status: 500 }
    );
  }
}
