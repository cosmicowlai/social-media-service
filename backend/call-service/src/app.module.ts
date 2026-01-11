import { Module } from '@nestjs/common';
import { CallController } from './call.controller';
import { CallService } from './call.service';
import { WebRtcSignalStore } from './signaling/webrtc-signal.store';

@Module({
  controllers: [CallController],
  providers: [CallService, WebRtcSignalStore],
})
export class AppModule {}
