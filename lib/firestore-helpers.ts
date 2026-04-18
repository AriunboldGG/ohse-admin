/**
 * Firestore Helper Functions
 * 
 * This file contains utility functions for common Firestore operations.
 * Use these functions in your API routes or server components.
 */

import { db } from "./firebase-admin";

/**
 * Example: Get all documents from a collection
 */
export async function getAllDocuments(collectionName: string) {
  try {
    const snapshot = await db.collection(collectionName).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error(`Error fetching documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Example: Get a single document by ID
 */
export async function getDocumentById(collectionName: string, docId: string) {
  try {
    const doc = await db.collection(collectionName).doc(docId).get();
    if (!doc.exists) {
      return null;
    }
    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error(`Error fetching document ${docId} from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Example: Create a new document
 */
export async function createDocument(collectionName: string, data: any) {
  try {
    const docRef = await db.collection(collectionName).add({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return {
      id: docRef.id,
      ...data,
    };
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Example: Update a document
 */
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: any
) {
  try {
    await db.collection(collectionName).doc(docId).update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return {
      id: docId,
      ...data,
    };
  } catch (error) {
    console.error(`Error updating document ${docId} in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Example: Delete a document
 */
export async function deleteDocument(collectionName: string, docId: string) {
  try {
    await db.collection(collectionName).doc(docId).delete();
    return { success: true };
  } catch (error) {
    console.error(`Error deleting document ${docId} from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Example: Query documents with filters
 */
export async function queryDocuments(
  collectionName: string,
  field: string,
  operator: FirebaseFirestore.WhereFilterOp,
  value: any
) {
  try {
    const snapshot = await db
      .collection(collectionName)
      .where(field, operator, value)
      .get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error(`Error querying ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Example: Get products by category
 */
export async function getProductsByCategory(categoryId: string) {
  return queryDocuments("products", "categoryId", "==", categoryId);
}

/**
 * Example: Get products by stock status
 */
export async function getProductsByStockStatus(stockStatus: string) {
  return queryDocuments("products", "stockStatus", "==", stockStatus);
}

