import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CallServiceClient } from './clients/call-service.client';
import { StartCallDto } from './dto/start-call.dto';
import { UpdateCallStatusDto } from './dto/update-call-status.dto';
import { WebRtcSignalDto } from './dto/webrtc-signal.dto';

@Controller('calls')
export class CallGatewayController {
  constructor(private readonly callClient: CallServiceClient) {}

  @Post()
  startCall(@Body() dto: StartCallDto) {
    return this.callClient.startCall(dto);
  }

  @Patch(':callId/status')
  updateStatus(
    @Param('callId') callId: string,
    @Body() dto: UpdateCallStatusDto,
  ) {
    return this.callClient.updateCallStatus(callId, dto);
  }

  @Get('conversation/:conversationId')
  listCalls(@Param('conversationId') conversationId: string) {
    return this.callClient.listCalls(conversationId);
  }

  @Post(':callId/signals/offer')
  addOffer(@Param('callId') callId: string, @Body() dto: WebRtcSignalDto) {
    return this.callClient.addOffer(callId, dto);
  }

  @Get(':callId/signals/offer')
  listOffers(@Param('callId') callId: string) {
    return this.callClient.listOffers(callId);
  }

  @Post(':callId/signals/answer')
  addAnswer(@Param('callId') callId: string, @Body() dto: WebRtcSignalDto) {
    return this.callClient.addAnswer(callId, dto);
  }

  @Get(':callId/signals/answer')
  listAnswers(@Param('callId') callId: string) {
    return this.callClient.listAnswers(callId);
  }

  @Post(':callId/signals/ice')
  addIceCandidate(@Param('callId') callId: string, @Body() dto: WebRtcSignalDto) {
    return this.callClient.addIceCandidate(callId, dto);
  }

  @Get(':callId/signals/ice')
  listIceCandidates(@Param('callId') callId: string) {
    return this.callClient.listIceCandidates(callId);
  }
}
