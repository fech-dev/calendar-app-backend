import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: !process.env.NODE_ENV
        ? '.env'
        : `.env.${process.env.NODE_ENV}`,
    }),
    MongooseModule.forRoot(process.env.DATABASE_URI, {
      dbName: process.env.DATABASE_NAME,
    }),

    EventsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
