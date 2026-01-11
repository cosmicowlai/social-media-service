import { Injectable } from '@nestjs/common';

export interface WebRtcSignal {
  senderId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

@Injectable()
export class WebRtcSignalStore {
  private readonly offers = new Map<string, WebRtcSignal[]>();
  private readonly answers = new Map<string, WebRtcSignal[]>();
  private readonly iceCandidates = new Map<string, WebRtcSignal[]>();

  addOffer(callId: string, signal: WebRtcSignal) {
    const existing = this.offers.get(callId) ?? [];
    existing.push(signal);
    this.offers.set(callId, existing);
  }

  addAnswer(callId: string, signal: WebRtcSignal) {
    const existing = this.answers.get(callId) ?? [];
    existing.push(signal);
    this.answers.set(callId, existing);
  }

  addIceCandidate(callId: string, signal: WebRtcSignal) {
    const existing = this.iceCandidates.get(callId) ?? [];
    existing.push(signal);
    this.iceCandidates.set(callId, existing);
  }

  listOffers(callId: string) {
    return this.offers.get(callId) ?? [];
  }

  listAnswers(callId: string) {
    return this.answers.get(callId) ?? [];
  }

  listIceCandidates(callId: string) {
    return this.iceCandidates.get(callId) ?? [];
  }
}
