import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ChatServiceClient } from './clients/chat-service.client';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('conversations')
export class ChatGatewayController {
  constructor(private readonly chatClient: ChatServiceClient) {}

  @Post()
  createConversation(@Body() dto: CreateConversationDto) {
    return this.chatClient.createConversation(dto);
  }

  @Get('user/:userId')
  listConversations(@Param('userId') userId: string) {
    return this.chatClient.listConversations(userId);
  }

  @Post(':conversationId/messages')
  sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatClient.sendMessage(conversationId, dto);
  }

  @Patch(':conversationId/messages/:messageId')
  updateMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Body() dto: { body: string },
  ) {
    return this.chatClient.updateMessage(conversationId, messageId, dto);
  }

  @Delete(':conversationId/messages/:messageId')
  deleteMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.chatClient.deleteMessage(conversationId, messageId);
  }

  @Get(':conversationId/messages')
  listMessages(@Param('conversationId') conversationId: string) {
    return this.chatClient.listMessages(conversationId);
  }
}
