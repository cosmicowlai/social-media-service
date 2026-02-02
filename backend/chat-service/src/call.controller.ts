import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CallService } from './call.service';
import { StartCallDto } from './dto/start-call.dto';
import { UpdateCallStatusDto } from './dto/update-call-status.dto';
import { WebRtcSignalDto } from './dto/webrtc-signal.dto';

@Controller('calls')
export class CallController {
  constructor(private readonly callService: CallService) {}

  @Post()
  startCall(@Body() dto: StartCallDto) {
    return this.callService.startCall(dto);
  }

  @Patch(':callId/status')
  updateStatus(
    @Param('callId') callId: string,
    @Body() dto: UpdateCallStatusDto,
  ) {
    return this.callService.updateStatus(callId, dto);
  }

  @Get('conversation/:conversationId')
  listCalls(@Param('conversationId') conversationId: string) {
    return this.callService.listCalls(conversationId);
  }

  @Post(':callId/signals/offer')
  addOffer(@Param('callId') callId: string, @Body() dto: WebRtcSignalDto) {
    this.callService.addOffer(callId, dto);
    return { status: 'ok' };
  }

  @Get(':callId/signals/offer')
  listOffers(@Param('callId') callId: string) {
    return this.callService.listOffers(callId);
  }

  @Post(':callId/signals/answer')
  addAnswer(@Param('callId') callId: string, @Body() dto: WebRtcSignalDto) {
    this.callService.addAnswer(callId, dto);
    return { status: 'ok' };
  }

  @Get(':callId/signals/answer')
  listAnswers(@Param('callId') callId: string) {
    return this.callService.listAnswers(callId);
  }

  @Post(':callId/signals/ice')
  addIceCandidate(@Param('callId') callId: string, @Body() dto: WebRtcSignalDto) {
    this.callService.addIceCandidate(callId, dto);
    return { status: 'ok' };
  }

  @Get(':callId/signals/ice')
  listIceCandidates(@Param('callId') callId: string) {
    return this.callService.listIceCandidates(callId);
  }
}
