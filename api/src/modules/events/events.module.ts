import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [EventsService],
})
export class EventsModule {}
