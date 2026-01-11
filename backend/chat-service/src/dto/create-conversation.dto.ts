import { ConversationMember, ConversationType } from '../../../shared/src/models/conversation';

export interface CreateConversationDto {
  name?: string;
  type: ConversationType;
  members: ConversationMember[];
}
