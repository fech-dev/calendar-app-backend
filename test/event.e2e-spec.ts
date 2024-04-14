import { INestApplication } from '@nestjs/common';
import { setupE2EApplication } from './setup';
import * as request from 'supertest';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as dayjs from 'dayjs';
import {
  createEvent,
  getCreateEventDto,
} from '../src/events/factories/event.factory';

describe('Events Controller (e2e)', () => {
  let app: INestApplication;
  let eventModel: Model<Event>;

  const events = [
    createEvent(() => ({
      start: dayjs('2024-04-13 09:00:00').toDate(),
      end: dayjs('2024-04-13 10:00:00').toDate(),
      allDay: false,
    })),
    createEvent(() => ({
      start: dayjs('2024-04-13 10:30:00').toDate(),
      end: dayjs('2024-04-13 11:00:00').toDate(),
      allDay: false,
    })),
    createEvent(() => ({
      start: dayjs('2024-04-15 10:30:00').toDate(),
      end: dayjs('2024-04-15 11:00:00').toDate(),
      allDay: false,
    })),
    createEvent(() => ({
      start: dayjs('2024-05-15 10:30:00').toDate(),
      end: dayjs('2024-05-15 11:00:00').toDate(),
      allDay: false,
    })),
    createEvent(() => ({
      start: dayjs('2024-05-15 10:30:00').toDate(),
      end: dayjs('2024-05-15 11:00:00').toDate(),
      allDay: false,
    })),
  ];

  beforeEach(async () => {
    app = await setupE2EApplication();
    eventModel = app.get(getModelToken(Event.name)) as Model<Event>;
  });

  afterEach(async () => {
    await eventModel.deleteMany();
  });

  describe('POST /events', () => {
    it('should respond with created event', async () => {
      const event = createEvent(() => ({
        start: dayjs('2024-04-13 10:10:00').toDate(),
        end: dayjs('2024-04-13 10:20:00').toDate(),
      }));
      const createEventDto = getCreateEventDto(event);

      await eventModel.create(events);

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(createEventDto);

      expect(response.statusCode).toBe(201);
      expect(response.body._id).toBeDefined();
      expect(response.body.name).toEqual(event.name);
      expect(response.body.allDay).toEqual(event.allDay);
      expect(response.body.start).toEqual(event.start.toISOString());
      expect(response.body.end).toEqual(event.end.toISOString());
    });

    it('should respond with BadRequest error code if no data is provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/events')
        .send({});

      expect(response.statusCode).toBe(400);

      expect(response.body.errors.name).toBeDefined();
      expect(response.body.errors.start).toBeDefined();
      expect(response.body.errors.allDay).toBeDefined();
    });

    it('should respond with error if cannot create event due to slots overlaps', async () => {
      const event = createEvent(() => ({
        start: dayjs('2024-04-13 09:30:00').toDate(),
        end: dayjs('2024-04-13 11:00:00').toDate(),
      }));
      const createEventDto = getCreateEventDto(event);

      await eventModel.create(events);

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(createEventDto);

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /events/:id', () => {
    beforeEach(async () => {
      await eventModel.create(events);
    });

    it('should respond with an event', async () => {
      const event = createEvent();
      await eventModel.create(event);

      const response = await request(app.getHttpServer())
        .get(`/events/${event._id}`)
        .send();

      expect(response.statusCode).toBe(200);
      expect(response.body._id).toBeDefined();
      expect(response.body.name).toEqual(event.name);
      expect(response.body.allDay).toEqual(event.allDay);
      expect(response.body.start).toEqual(event.start.toISOString());
      expect(response.body.end).toEqual(event.end.toISOString());
    });

    it('should respond with NotFoundError error code if event does not exists', async () => {
      const event = createEvent();

      const response = await request(app.getHttpServer())
        .get(`/events/${event._id}`)
        .send();

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /events', () => {
    beforeEach(async () => {
      await eventModel.create(events);
    });

    it('should respond with a list of events', async () => {
      const response = await request(app.getHttpServer()).get('/events').send();

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(5);
    });

    it('should respond with a filtered list of events (datesRange)', async () => {
      const response = await request(app.getHttpServer())
        .get('/events')
        .query({
          datesRange: '["2024-04-01 00:00:00", "2024-04-30 23:59:59"]',
        })
        .send();

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(3);
    });

    it('should respond with BadRequestError if wrong dates range given (datesRange)', async () => {
      const response = await request(app.getHttpServer())
        .get('/events')
        .query({
          datesRange: '["2024-05-01 00:00:00", "2024-04-30 23:59:59"]',
        })
        .send();

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toEqual(
        'Second date element of the array cannot be less then first date element',
      );
    });
  });

  describe('PATCH /events/:id', () => {
    const event = events[0];

    beforeEach(async () => {
      await eventModel.create(event);
    });

    it('should update event', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/events/${event._id}`)
        .send({
          name: 'Event Updated',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body._id).toEqual(event._id);
      expect(response.body.name).toEqual('Event Updated');
    });

    it('should respond with a BadRequestError if trying to update dates and overlapping events found', async () => {
      await eventModel.create(events[1]);

      const response = await request(app.getHttpServer())
        .patch(`/events/${event._id}`)
        .send({
          ...event,
          start: events[1].start,
          end: events[1].end,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe('EventOverlapError');
    });

    it.todo('should respond with a NotFoundError if event not found');
  });

  describe('DELETE /events/:id', () => {
    const event = events[0];

    beforeEach(async () => {
      await eventModel.create(events);
    });

    it('should delete event', async () => {
      const response = await request(app.getHttpServer()).delete(
        `/events/${event._id}`,
      );

      expect(response.statusCode).toBe(200);
      expect(response.body._id).toEqual(event._id);
    });

    it.todo('should respond with a NotFoundError if event not found');
  });
});
