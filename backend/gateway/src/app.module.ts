import { Module } from '@nestjs/common';
import { ChatGatewayController } from './chat-gateway.controller';
import { CallGatewayController } from './call-gateway.controller';
import { ChatServiceClient } from './clients/chat-service.client';
import { CallServiceClient } from './clients/call-service.client';

@Module({
  controllers: [ChatGatewayController, CallGatewayController],
  providers: [ChatServiceClient, CallServiceClient],
})
export class AppModule {}
