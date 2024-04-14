import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

@Schema()
export class Event {
  @Prop()
  name: string;

  @Prop()
  allDay: boolean;

  @Prop()
  start: Date;

  @Prop()
  end: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
