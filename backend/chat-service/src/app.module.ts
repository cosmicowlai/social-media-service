import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PostgresChatRepository } from './repositories/postgres-chat.repository';
import { CHAT_REPOSITORY } from './repositories/chat.repository';
import { MessageQueueService } from './queue/message-queue.service';
import { ChatGateway } from './realtime/chat.gateway';
import { CallController } from './call.controller';
import { CallService } from './call.service';
import { WebRtcSignalStore } from './signaling/webrtc-signal.store';

@Module({
  controllers: [ChatController, CallController],
  providers: [
    ChatService,
    ChatGateway,
    CallService,
    WebRtcSignalStore,
    MessageQueueService,
    {
      provide: CHAT_REPOSITORY,
      useClass: PostgresChatRepository,
    },
  ],
})
export class AppModule {}
