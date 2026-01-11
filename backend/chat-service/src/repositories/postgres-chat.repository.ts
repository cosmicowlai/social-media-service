import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { Conversation } from '../../../shared/src/models/conversation';
import { Message } from '../../../shared/src/models/message';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { ChatRepository } from './chat.repository';

@Injectable()
export class PostgresChatRepository implements ChatRepository {
  private readonly pool: Pool;
  private readonly schemaReady: Promise<void>;

  constructor() {
    const connectionString =
      process.env.CHAT_DATABASE_URL ??
      'postgresql://chat:chat@localhost:5432/chatdb';
    this.pool = new Pool({ connectionString });
    this.schemaReady = this.ensureSchema();
  }

  async createConversation(dto: CreateConversationDto): Promise<Conversation> {
    await this.schemaReady;
    const conversation: Conversation = {
      id: randomUUID(),
      name: dto.name,
      type: dto.type,
      members: dto.members,
      createdAt: new Date().toISOString(),
    };

    await this.pool.query(
      `
      INSERT INTO conversations (id, name, type, members, created_at)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        conversation.id,
        conversation.name ?? null,
        conversation.type,
        JSON.stringify(conversation.members),
        conversation.createdAt,
      ],
    );

    return conversation;
  }

  async listConversationsForUser(userId: string): Promise<Conversation[]> {
    await this.schemaReady;
    const { rows } = await this.pool.query(
      `
      SELECT id, name, type, members, created_at
      FROM conversations
      WHERE members @> $1::jsonb
      ORDER BY created_at DESC
      `,
      [JSON.stringify([{ userId }])],
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name ?? undefined,
      type: row.type,
      members: row.members,
      createdAt: row.created_at,
    }));
  }

  async addMessage(conversationId: string, dto: SendMessageDto): Promise<Message> {
    await this.schemaReady;
    const { rowCount } = await this.pool.query(
      'SELECT 1 FROM conversations WHERE id = $1',
      [conversationId],
    );

    if (!rowCount) {
      throw new Error('Conversation not found');
    }

    const message: Message = {
      id: randomUUID(),
      conversationId,
      senderId: dto.senderId,
      body: dto.body,
      sentAt: new Date().toISOString(),
    };

    await this.pool.query(
      `
      INSERT INTO messages (id, conversation_id, sender_id, body, sent_at)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        message.id,
        message.conversationId,
        message.senderId,
        message.body,
        message.sentAt,
      ],
    );

    return message;
  }

  async updateMessage(
    conversationId: string,
    messageId: string,
    body: string,
  ): Promise<Message> {
    await this.schemaReady;
    const { rows } = await this.pool.query(
      `
      UPDATE messages
      SET body = $1
      WHERE id = $2 AND conversation_id = $3
      RETURNING id, conversation_id, sender_id, body, sent_at
      `,
      [body, messageId, conversationId],
    );

    const updated = rows[0];
    if (!updated) {
      throw new Error('Message not found');
    }

    return {
      id: updated.id,
      conversationId: updated.conversation_id,
      senderId: updated.sender_id,
      body: updated.body,
      sentAt: updated.sent_at,
    };
  }

  async deleteMessage(conversationId: string, messageId: string): Promise<Message> {
    await this.schemaReady;
    const { rows } = await this.pool.query(
      `
      DELETE FROM messages
      WHERE id = $1 AND conversation_id = $2
      RETURNING id, conversation_id, sender_id, body, sent_at
      `,
      [messageId, conversationId],
    );

    const deleted = rows[0];
    if (!deleted) {
      throw new Error('Message not found');
    }

    return {
      id: deleted.id,
      conversationId: deleted.conversation_id,
      senderId: deleted.sender_id,
      body: deleted.body,
      sentAt: deleted.sent_at,
    };
  }

  async listMessages(conversationId: string): Promise<Message[]> {
    await this.schemaReady;
    const { rows } = await this.pool.query(
      `
      SELECT id, conversation_id, sender_id, body, sent_at
      FROM messages
      WHERE conversation_id = $1
      ORDER BY sent_at ASC
      `,
      [conversationId],
    );

    return rows.map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      body: row.body,
      sentAt: row.sent_at,
    }));
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async ensureSchema(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY,
        name TEXT,
        type TEXT NOT NULL,
        members JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY,
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL,
        body TEXT NOT NULL,
        sent_at TIMESTAMPTZ NOT NULL
      );
    `);
  }
}
