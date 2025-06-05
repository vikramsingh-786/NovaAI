import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  addMessageToChat,
  getChatById,
  getChatsCollection,
} from '@/lib/mongo';
import { ObjectId as MongoObjectId } from 'mongodb';
import type { Message, Chat, ChatDocument } from '@/types';

interface RouteContext {
  params: {
    id: string;
  };
}

function transformDocumentToChat(doc: ChatDocument): Chat {
  return {
    _id: doc._id.toString(),
    userId: doc.userId,
    title: doc.title,
    messages: doc.messages.map(m => ({
        id: m.id,
        type: m.type,
        content: m.content,
        timestamp: m.timestamp,
        isStreaming: m.isStreaming || false
    })),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { params } = context;
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const message = body.message as Message;
    const chatId = params.id;

    if (!chatId || typeof chatId !== 'string' || !MongoObjectId.isValid(chatId)) {
        return NextResponse.json({ error: 'Invalid chat ID format' }, { status: 400 });
    }
    if (!message || typeof message.content !== 'string' || typeof message.type !== 'string') {
        return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
    }

    const chatsCollection = await getChatsCollection();
    const chatExists = await chatsCollection.findOne({
      _id: new MongoObjectId(chatId),
      userId
    });
    if (!chatExists) {
      return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 });
    }

    const dbMessage: Message = {
        id: message.id || Date.now(),
        type: message.type,
        content: message.content,
        timestamp: message.timestamp || new Date().toISOString(),
        isStreaming: message.isStreaming || false,
    };
    await addMessageToChat(chatId, dbMessage);
    return NextResponse.json({ success: true });

  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('bsonobjectid')) {
        return NextResponse.json({ error: 'Invalid chat ID format provided.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { params } = context;
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const chatId = params.id;
    if (!chatId || typeof chatId !== 'string' || !MongoObjectId.isValid(chatId)) {
        return NextResponse.json({ error: 'Invalid chat ID format' }, { status: 400 });
    }

    const chat = await getChatById(chatId, userId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 });
    }
    return NextResponse.json({ chat });

  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('bsonobjectid')) {
        return NextResponse.json({ error: 'Invalid chat ID format provided.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { params } = context;
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title } = body;
    const chatId = params.id;

    if (!chatId || typeof chatId !== 'string' || !MongoObjectId.isValid(chatId)) {
        return NextResponse.json({ error: 'Invalid chat ID format' }, { status: 400 });
    }

    const chatsCollection = await getChatsCollection();
    const chatExists = await chatsCollection.findOne({
        _id: new MongoObjectId(chatId),
        userId
    });
    if (!chatExists) {
        return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 });
    }

    const updateFields: { updatedAt: Date; title?: string } = {
      updatedAt: new Date()
    };
    if (typeof title === 'string') {
      updateFields.title = title.trim();
      if (updateFields.title === "") {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
    } else if (title !== undefined && typeof title !== 'string') {
        return NextResponse.json({ error: 'Invalid title format' }, { status: 400 });
    }

    const result = await chatsCollection.findOneAndUpdate(
      { _id: new MongoObjectId(chatId), userId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    const updatedDoc = result;
    if (!updatedDoc) {
        return NextResponse.json({ error: 'Chat not found or failed to update' }, { status: 404 });
    }

    const responseChat: Chat = transformDocumentToChat(updatedDoc);
    return NextResponse.json({ success: true, chat: responseChat });

  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('bsonobjectid')) {
        return NextResponse.json({ error: 'Invalid chat ID format provided.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { params } = context;
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const chatId = params.id;
    if (!chatId || typeof chatId !== 'string' || !MongoObjectId.isValid(chatId)) {
        return NextResponse.json({ error: 'Invalid chat ID format' }, { status: 400 });
    }

    const chatsCollection = await getChatsCollection();
    const result = await chatsCollection.deleteOne({
      _id: new MongoObjectId(chatId),
      userId
    });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 });
    }
    return NextResponse.json({ success: true });

  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('bsonobjectid')) {
        return NextResponse.json({ error: 'Invalid chat ID format provided.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}