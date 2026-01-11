import { Worker } from 'bullmq';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { Message } from '../../shared/src/models/message';

const connection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
};

const connectionString =
  process.env.CHAT_DATABASE_URL ??
  'postgresql://chat:chat@localhost:5432/chatdb';

const pool = new Pool({ connectionString });

const ensureSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY,
      name TEXT,
      type TEXT NOT NULL,
      members JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY,
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL,
      body TEXT NOT NULL,
      sent_at TIMESTAMPTZ NOT NULL
    );
  `);
};

const startWorker = async () => {
  await ensureSchema();

  const worker = new Worker(
    'message-workflow',
    async (job) => {
      const { conversationId, senderId, body } = job.data as {
        conversationId: string;
        senderId: string;
        body: string;
      };

      const { rowCount } = await pool.query(
        'SELECT 1 FROM conversations WHERE id = $1',
        [conversationId],
      );

      if (!rowCount) {
        throw new Error('Conversation not found');
      }

      const message: Message = {
        id: randomUUID(),
        conversationId,
        senderId,
        body,
        sentAt: new Date().toISOString(),
      };

      await pool.query(
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
    },
    { connection },
  );

  worker.on('failed', (job, error) => {
    console.error(`Job ${job?.id ?? 'unknown'} failed`, error);
  });
};

startWorker().catch((error) => {
  console.error('Worker failed to start', error);
  process.exit(1);
});
