import {
  MongoClient,
  Db,
  Collection,
  ObjectId as MongoObjectId,
} from "mongodb";
import type { ChatDocument, Message, Chat, UserDocument } from "@/types";

const uri = process.env.MONGODB_URI!;
if (!uri) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const db = await getDatabase();
  return db.collection<UserDocument>("users");
}

export async function findOrCreateUser(
  clerkUserId: string,
  email: string,
  firstName?: string,
  lastName?: string,
  imageUrl?: string
): Promise<UserDocument> {
  const usersCollection = await getUsersCollection();
  let user = await usersCollection.findOne({ clerkUserId });

  if (!user) {
    const now = new Date();
    const newUser: Omit<UserDocument, "_id"> = {
      clerkUserId,
      email,
      firstName,
      lastName,
      imageUrl,
      subscriptionStatus: "free", 
      messageCountToday: 0,
      createdAt: now,
      updatedAt: now,
    };
    const result = await usersCollection.insertOne(newUser as UserDocument);
    user = { _id: result.insertedId, ...newUser } as UserDocument;
  } else {
    const updateFields: Partial<UserDocument> = {};
    if (email && user.email !== email) updateFields.email = email;
    if (firstName && user.firstName !== firstName)
      updateFields.firstName = firstName;
    if (lastName && user.lastName !== lastName)
      updateFields.lastName = lastName;
    if (imageUrl && user.imageUrl !== imageUrl)
      updateFields.imageUrl = imageUrl;

    if (Object.keys(updateFields).length > 0) {
      updateFields.updatedAt = new Date();
      await usersCollection.updateOne({ clerkUserId }, { $set: updateFields });
      user = { ...user, ...updateFields };
    }
  }
  return user;
}

export async function getUserByClerkId(
  clerkUserId: string
): Promise<UserDocument | null> {
  const usersCollection = await getUsersCollection();
  return usersCollection.findOne({ clerkUserId });
}

export async function getUserByStripeCustomerId(
  stripeCustomerId: string
): Promise<UserDocument | null> {
  const usersCollection = await getUsersCollection();
  return usersCollection.findOne({ stripeCustomerId });
}

export async function updateUserSubscription(
  clerkUserId: string,
  subscriptionData: Partial<
    Pick<
      UserDocument,
      | "stripeCustomerId"
      | "stripeSubscriptionId"
      | "stripePriceId"
      | "stripeCurrentPeriodEnd"
      | "subscriptionStatus"
    >
  >
): Promise<void> {
  const usersCollection = await getUsersCollection();
  await usersCollection.updateOne(
    { clerkUserId },
    { $set: { ...subscriptionData, updatedAt: new Date() } }
  );
}
export async function getUserSubscriptionStatus(
  clerkUserId: string
): Promise<UserDocument["subscriptionStatus"] | "not_found"> {
  const user = await getUserByClerkId(clerkUserId);
  if (!user) return "not_found";
  return user.subscriptionStatus;
}

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || "deepseek_clone");
}

export async function getChatsCollection(): Promise<Collection<ChatDocument>> {
  const db = await getDatabase();
  return db.collection<ChatDocument>("chats");
}

export function transformChatDocument(chatDoc: ChatDocument): Chat {
  // Removed async, it's synchronous
  return {
    _id: chatDoc._id.toString(),
    userId: chatDoc.userId,
    title: chatDoc.title,
    messages: chatDoc.messages.map((m) => ({
      id: m.id,
      type: m.type,
      content: m.content,
      timestamp: m.timestamp, 
      isStreaming: m.isStreaming || false, 
    })),
    createdAt: chatDoc.createdAt.toISOString(),
    updatedAt: chatDoc.updatedAt.toISOString(),
  };
}

export async function getUserChats(userId: string): Promise<Chat[]> {
  const chatsCollection = await getChatsCollection();
  const chatDocs = await chatsCollection
    .find({ userId })
    .sort({ updatedAt: -1 })
    .toArray();
  return chatDocs.map((doc) => transformChatDocument(doc));
}
export async function createChat(userId: string, title: string): Promise<Chat> {
  const chatsCollection = await getChatsCollection();
  const now = new Date();
  const newChatDocument: Omit<ChatDocument, "_id"> = {
    userId,
    title,
    messages: [], 
    createdAt: now,
    updatedAt: now,
  };

  const result = await chatsCollection.insertOne(
    newChatDocument as ChatDocument
  );

  const createdDoc: ChatDocument = {
    _id: result.insertedId,
    userId: newChatDocument.userId,
    title: newChatDocument.title,
    messages: newChatDocument.messages,
    createdAt: newChatDocument.createdAt,
    updatedAt: newChatDocument.updatedAt,
  };
  return transformChatDocument(createdDoc);
}

export async function getChatById(
  chatId: string,
  userId: string
): Promise<Chat | null> {
  const chatsCollection = await getChatsCollection();
  if (!MongoObjectId.isValid(chatId)) return null; 
  const chatDoc = await chatsCollection.findOne({
    _id: new MongoObjectId(chatId),
    userId,
  });
  return chatDoc ? transformChatDocument(chatDoc) : null;
}

export async function addMessageToChat(
  chatId: string,
  message: Message
): Promise<void> {
  const chatsCollection = await getChatsCollection();
  await chatsCollection.updateOne(
    { _id: new MongoObjectId(chatId) },
    {
      $push: { messages: message as any },
      $set: { updatedAt: new Date() },
    }
  );
}
