import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PostgresChatRepository } from './repositories/postgres-chat.repository';
import { CHAT_REPOSITORY } from './repositories/chat.repository';
import { MessageQueueService } from './queue/message-queue.service';
import { ChatGateway } from './realtime/chat.gateway';

@Module({
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    MessageQueueService,
    {
      provide: CHAT_REPOSITORY,
      useClass: PostgresChatRepository,
    },
  ],
})
export class AppModule {}
