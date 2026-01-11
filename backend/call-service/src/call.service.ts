import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CallSession } from '../../../shared/src/models/call';
import { StartCallDto } from './dto/start-call.dto';
import { UpdateCallStatusDto } from './dto/update-call-status.dto';
import { WebRtcSignalDto } from './dto/webrtc-signal.dto';
import { WebRtcSignalStore } from './signaling/webrtc-signal.store';

@Injectable()
export class CallService {
  private readonly calls = new Map<string, CallSession>();

  constructor(private readonly signalStore: WebRtcSignalStore) {}

  startCall(dto: StartCallDto): CallSession {
    const call: CallSession = {
      id: randomUUID(),
      conversationId: dto.conversationId,
      type: dto.type,
      status: 'ringing',
      startedAt: new Date().toISOString(),
      participants: dto.participants,
    };

    this.calls.set(call.id, call);
    return call;
  }

  updateStatus(callId: string, dto: UpdateCallStatusDto): CallSession {
    const call = this.calls.get(callId);

    if (!call) {
      throw new Error('Call not found');
    }

    const updated = { ...call, status: dto.status };
    this.calls.set(callId, updated);
    return updated;
  }

  listCalls(conversationId: string): CallSession[] {
    return Array.from(this.calls.values()).filter(
      (call) => call.conversationId === conversationId,
    );
  }

  addOffer(callId: string, dto: WebRtcSignalDto) {
    this.ensureCall(callId);
    this.signalStore.addOffer(callId, {
      senderId: dto.senderId,
      payload: dto.payload,
      createdAt: new Date().toISOString(),
    });
  }

  addAnswer(callId: string, dto: WebRtcSignalDto) {
    this.ensureCall(callId);
    this.signalStore.addAnswer(callId, {
      senderId: dto.senderId,
      payload: dto.payload,
      createdAt: new Date().toISOString(),
    });
  }

  addIceCandidate(callId: string, dto: WebRtcSignalDto) {
    this.ensureCall(callId);
    this.signalStore.addIceCandidate(callId, {
      senderId: dto.senderId,
      payload: dto.payload,
      createdAt: new Date().toISOString(),
    });
  }

  listOffers(callId: string) {
    this.ensureCall(callId);
    return this.signalStore.listOffers(callId);
  }

  listAnswers(callId: string) {
    this.ensureCall(callId);
    return this.signalStore.listAnswers(callId);
  }

  listIceCandidates(callId: string) {
    this.ensureCall(callId);
    return this.signalStore.listIceCandidates(callId);
  }

  private ensureCall(callId: string) {
    if (!this.calls.has(callId)) {
      throw new Error('Call not found');
    }
  }
}
