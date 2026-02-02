import { CallParticipant, CallType } from '../../../shared/src/models/call';

export interface StartCallDto {
  conversationId: string;
  type: CallType;
  participants: CallParticipant[];
}
