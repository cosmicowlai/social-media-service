import { Inject, Injectable } from '@nestjs/common';
import { Conversation } from '../../../shared/src/models/conversation';
import { Message } from '../../../shared/src/models/message';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatRepository, CHAT_REPOSITORY } from './repositories/chat.repository';
import { MessageQueueService } from './queue/message-queue.service';
import { ChatGateway } from './realtime/chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly repository: ChatRepository,
    private readonly messageQueue: MessageQueueService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async createConversation(dto: CreateConversationDto): Promise<Conversation> {
    return this.repository.createConversation(dto);
  }

  async listConversationsForUser(userId: string): Promise<Conversation[]> {
    return this.repository.listConversationsForUser(userId);
  }

  async sendMessage(conversationId: string, dto: SendMessageDto): Promise<Message> {
    const message = await this.messageQueue.enqueueMessage({
      conversationId,
      senderId: dto.senderId,
      body: dto.body,
    });

    this.chatGateway.emitMessageCreated(message);
    return message;
  }

  async updateMessage(conversationId: string, messageId: string, body: string) {
    const message = await this.repository.updateMessage(
      conversationId,
      messageId,
      body,
    );
    this.chatGateway.emitMessageUpdated(message);
    return message;
  }

  async deleteMessage(conversationId: string, messageId: string) {
    const message = await this.repository.deleteMessage(conversationId, messageId);
    this.chatGateway.emitMessageDeleted(message);
    return message;
  }

  async listMessages(conversationId: string): Promise<Message[]> {
    return this.repository.listMessages(conversationId);
  }
}
