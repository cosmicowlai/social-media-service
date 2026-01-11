import { Injectable } from '@nestjs/common';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { SendMessageDto } from '../dto/send-message.dto';

@Injectable()
export class ChatServiceClient {
  private readonly baseUrl = process.env.CHAT_SERVICE_URL ?? 'http://localhost:3001';

  async createConversation(dto: CreateConversationDto) {
    return this.request(`${this.baseUrl}/conversations`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async listConversations(userId: string) {
    return this.request(`${this.baseUrl}/conversations/user/${userId}`);
  }

  async sendMessage(conversationId: string, dto: SendMessageDto) {
    return this.request(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
    );
  }

  async updateMessage(conversationId: string, messageId: string, dto: { body: string }) {
    return this.request(
      `${this.baseUrl}/conversations/${conversationId}/messages/${messageId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(dto),
      },
    );
  }

  async deleteMessage(conversationId: string, messageId: string) {
    return this.request(
      `${this.baseUrl}/conversations/${conversationId}/messages/${messageId}`,
      {
        method: 'DELETE',
      },
    );
  }

  async listMessages(conversationId: string) {
    return this.request(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
    );
  }

  private async request(url: string, init?: RequestInit) {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(payload || `Request failed with status ${response.status}`);
    }

    return response.json();
  }
}
