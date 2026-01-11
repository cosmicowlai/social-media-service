import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('conversations')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createConversation(@Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(dto);
  }

  @Get('user/:userId')
  async listConversations(@Param('userId') userId: string) {
    return this.chatService.listConversationsForUser(userId);
  }

  @Post(':conversationId/messages')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(conversationId, dto);
  }

  @Patch(':conversationId/messages/:messageId')
  async updateMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.chatService.updateMessage(conversationId, messageId, dto.body);
  }

  @Delete(':conversationId/messages/:messageId')
  async deleteMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.chatService.deleteMessage(conversationId, messageId);
  }

  @Get(':conversationId/messages')
  async listMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.listMessages(conversationId);
  }
}
