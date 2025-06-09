import { IndexType, Permission } from "node-appwrite";

import { db, questionCollection } from "../name";

import { databases } from "./config";

async function waitForAttribute(
  dbId: string,
  collectionId: string,
  attributeId: string,
  retries = 15,
  delay = 3000
) {
  for (let i = 0; i < retries; i++) {
    try {
      const attribute = await databases.getAttribute(
        dbId,
        collectionId,
        attributeId
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((attribute as any).status === "available") {
        return;
      } else {
        console.log(`Attribute '${attributeId}' exists but not ready yet...`);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log(`Waiting for attribute '${attributeId}' to be created...`);
    }
    await new Promise((res) => setTimeout(res, delay));
  }
  throw new Error(`Attribute ${attributeId} not available after waiting.`);
}

export default async function createQuestionCollection() {
  // create collection
  await databases.createCollection(db, questionCollection, questionCollection, [
    Permission.read("any"),
    Permission.read("users"),
    Permission.create("users"),
    Permission.update("users"),
    Permission.delete("users"),
  ]);
  console.log("Question collection is created.");

  // creating attributes and Indexes
  await Promise.all([
    databases.createStringAttribute(db, questionCollection, "title", 100, true),
    databases.createStringAttribute(
      db,
      questionCollection,
      "content",
      10000,
      true
    ),
    databases.createStringAttribute(
      db,
      questionCollection,
      "authorId",
      50,
      true
    ),
    databases.createStringAttribute(
      db,
      questionCollection,
      "tags",
      100,
      true,
      undefined,
      true
    ),
    databases.createStringAttribute(
      db,
      questionCollection,
      "attachmentId",
      50,
      false
    ),
  ]);

  console.log("Question Attribute created");

  // Wait for attributes to become available
  await Promise.all([
    waitForAttribute(db, questionCollection, "title"),
    waitForAttribute(db, questionCollection, "content"),
  ]);

  // create Indexes
  try {
    await Promise.all([
      databases.createIndex(
        db,
        questionCollection,
        "title",
        IndexType.Fulltext,
        ["title"],
        ["asc"]
      ),
      databases.createIndex(
        db,
        questionCollection,
        "content",
        IndexType.Fulltext,
        ["content"],
        ["asc"]
      ),
    ]);

    console.log("Question Indexes created");
  } catch (error) {
    console.log("error while creating indexes: ", error);
  }
}
