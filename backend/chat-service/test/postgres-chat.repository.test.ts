import test from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { PostgresChatRepository } from '../src/repositories/postgres-chat.repository';

const connectionString =
  process.env.CHAT_DATABASE_URL ??
  'postgresql://chat:chat@localhost:5432/chatdb';

const cleanupDatabase = async () => {
  const pool = new Pool({ connectionString });
  await pool.query('DELETE FROM messages;');
  await pool.query('DELETE FROM conversations;');
  await pool.end();
};

test('PostgresChatRepository persists, updates, and deletes messages', async () => {
  await cleanupDatabase();

  const repository = new PostgresChatRepository();
  const conversation = await repository.createConversation({
    name: 'Launch Plan',
    type: 'group',
    members: [
      { userId: 'user-1', displayName: 'Alex' },
      { userId: 'user-2', displayName: 'Jordan' },
    ],
  });

  const message = await repository.addMessage(conversation.id, {
    senderId: 'user-1',
    body: 'Kickoff at 2 PM.',
  });

  const updated = await repository.updateMessage(
    conversation.id,
    message.id,
    'Kickoff moved to 3 PM.',
  );

  const messages = await repository.listMessages(conversation.id);

  assert.equal(messages.length, 1);
  assert.equal(updated.body, 'Kickoff moved to 3 PM.');

  const deleted = await repository.deleteMessage(conversation.id, message.id);
  const afterDelete = await repository.listMessages(conversation.id);

  assert.equal(deleted.id, message.id);
  assert.equal(afterDelete.length, 0);

  await repository.close();
});
