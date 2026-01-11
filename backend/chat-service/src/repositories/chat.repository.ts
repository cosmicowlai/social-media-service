import { Conversation } from '../../../shared/src/models/conversation';
import { Message } from '../../../shared/src/models/message';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { SendMessageDto } from '../dto/send-message.dto';

export const CHAT_REPOSITORY = Symbol('CHAT_REPOSITORY');

export interface ChatRepository {
  createConversation(dto: CreateConversationDto): Promise<Conversation>;
  listConversationsForUser(userId: string): Promise<Conversation[]>;
  addMessage(conversationId: string, dto: SendMessageDto): Promise<Message>;
  updateMessage(
    conversationId: string,
    messageId: string,
    body: string,
  ): Promise<Message>;
  deleteMessage(conversationId: string, messageId: string): Promise<Message>;
  listMessages(conversationId: string): Promise<Message[]>;
}
