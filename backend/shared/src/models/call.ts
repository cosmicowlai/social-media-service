export type CallType = 'audio' | 'video';
export type CallStatus = 'ringing' | 'active' | 'ended';

export interface CallParticipant {
  userId: string;
  displayName: string;
}

export interface CallSession {
  id: string;
  conversationId: string;
  type: CallType;
  status: CallStatus;
  startedAt: string;
  participants: CallParticipant[];
}
