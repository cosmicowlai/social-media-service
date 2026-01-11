export type ConversationType = 'one_to_one' | 'group';

export interface ConversationMember {
  userId: string;
  displayName: string;
}

export interface Conversation {
  id: string;
  name?: string;
  type: ConversationType;
  members: ConversationMember[];
  createdAt: string;
}
