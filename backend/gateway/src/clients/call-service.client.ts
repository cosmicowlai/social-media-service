import { Injectable } from '@nestjs/common';
import { StartCallDto } from '../dto/start-call.dto';
import { UpdateCallStatusDto } from '../dto/update-call-status.dto';
import { WebRtcSignalDto } from '../dto/webrtc-signal.dto';

@Injectable()
export class CallServiceClient {
  private readonly baseUrl = process.env.CALL_SERVICE_URL ?? 'http://localhost:3002';

  async startCall(dto: StartCallDto) {
    return this.request(`${this.baseUrl}/calls`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateCallStatus(callId: string, dto: UpdateCallStatusDto) {
    return this.request(`${this.baseUrl}/calls/${callId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async listCalls(conversationId: string) {
    return this.request(`${this.baseUrl}/calls/conversation/${conversationId}`);
  }

  async addOffer(callId: string, dto: WebRtcSignalDto) {
    return this.request(`${this.baseUrl}/calls/${callId}/signals/offer`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async listOffers(callId: string) {
    return this.request(`${this.baseUrl}/calls/${callId}/signals/offer`);
  }

  async addAnswer(callId: string, dto: WebRtcSignalDto) {
    return this.request(`${this.baseUrl}/calls/${callId}/signals/answer`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async listAnswers(callId: string) {
    return this.request(`${this.baseUrl}/calls/${callId}/signals/answer`);
  }

  async addIceCandidate(callId: string, dto: WebRtcSignalDto) {
    return this.request(`${this.baseUrl}/calls/${callId}/signals/ice`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async listIceCandidates(callId: string) {
    return this.request(`${this.baseUrl}/calls/${callId}/signals/ice`);
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
