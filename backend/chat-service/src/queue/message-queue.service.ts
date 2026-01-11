import { Injectable } from '@nestjs/common';
import { Queue, QueueEvents } from 'bullmq';

export interface MessageJobPayload {
  conversationId: string;
  senderId: string;
  body: string;
}

@Injectable()
export class MessageQueueService {
  private readonly queue: Queue<MessageJobPayload>;
  private readonly queueEvents: QueueEvents;

  constructor() {
    const connection = {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    };

    this.queue = new Queue<MessageJobPayload>('message-workflow', { connection });
    this.queueEvents = new QueueEvents('message-workflow', { connection });
  }

  async enqueueMessage(payload: MessageJobPayload) {
    const job = await this.queue.add('persist-message', payload);
    return job.waitUntilFinished(this.queueEvents);
  }
}
