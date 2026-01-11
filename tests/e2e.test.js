import test from 'node:test';
import assert from 'node:assert/strict';

const gatewayUrl = process.env.GATEWAY_URL ?? 'http://gateway:3000';

const waitForGateway = async () => {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${gatewayUrl}/conversations/user/healthcheck`);
      if (response.ok || response.status === 404) {
        return;
      }
    } catch (error) {
      // ignore
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('Gateway did not become ready');
};

const createConversation = async () => {
  const response = await fetch(`${gatewayUrl}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ops Sync',
      type: 'group',
      members: [
        { userId: 'user-1', displayName: 'Alex' },
        { userId: 'user-2', displayName: 'Jordan' },
      ],
    }),
  });

  assert.equal(response.status, 201);
  return response.json();
};

test('end-to-end chat and call flow', async () => {
  await waitForGateway();

  const conversation = await createConversation();

  const messageResponse = await fetch(
    `${gatewayUrl}/conversations/${conversation.id}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: 'user-1',
        body: 'Hello from E2E test.',
      }),
    },
  );

  assert.equal(messageResponse.status, 201);
  const createdMessage = await messageResponse.json();

  const updateResponse = await fetch(
    `${gatewayUrl}/conversations/${conversation.id}/messages/${createdMessage.id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: 'Updated via E2E test.',
      }),
    },
  );

  assert.equal(updateResponse.status, 200);

  const messages = await fetch(
    `${gatewayUrl}/conversations/${conversation.id}/messages`,
  ).then((res) => res.json());

  assert.equal(messages.length, 1);
  assert.equal(messages[0].body, 'Updated via E2E test.');

  const deleteResponse = await fetch(
    `${gatewayUrl}/conversations/${conversation.id}/messages/${createdMessage.id}`,
    {
      method: 'DELETE',
    },
  );

  assert.equal(deleteResponse.status, 200);

  const afterDelete = await fetch(
    `${gatewayUrl}/conversations/${conversation.id}/messages`,
  ).then((res) => res.json());

  assert.equal(afterDelete.length, 0);

  const callResponse = await fetch(`${gatewayUrl}/calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: conversation.id,
      type: 'audio',
      participants: [
        { userId: 'user-1', displayName: 'Alex' },
        { userId: 'user-2', displayName: 'Jordan' },
      ],
    }),
  });

  assert.equal(callResponse.status, 201);

  const calls = await fetch(
    `${gatewayUrl}/calls/conversation/${conversation.id}`,
  ).then((res) => res.json());

  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, 'audio');
});
