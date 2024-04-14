import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createMany } from '../../utils/test/factories';
import { createEvent, getCreateEventDto } from './factories/event.factory';
import { Event } from './event.schema';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import * as dayjs from 'dayjs';
import { faker } from '@faker-js/faker';
import { EventOverlapError } from './errors/event-overlap-error';

describe('EventsController', () => {
  let controller: EventsController;
  let service: EventsService;
  let event: ReturnType<typeof createEvent>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        EventsService,
        {
          provide: getModelToken(Event.name),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
    event = createEvent();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('should create a new event', async () => {
      const createEventDto = getCreateEventDto(event);

      //@ts-expect-error type missmatch with _id prop
      jest.spyOn(service, 'create').mockResolvedValue(event);

      const result = await controller.create(createEventDto);
      expect(result).toEqual(event);
    });

    it('should respond with BadRequest error', async () => {
      const createEventDto = getCreateEventDto(event);

      jest.spyOn(service, 'create').mockRejectedValue(new EventOverlapError());

      const callback = () => controller.create(createEventDto);
      await expect(callback).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne()', () => {
    it('should return an event', async () => {
      //@ts-expect-error type missmatch with _id prop
      jest.spyOn(service, 'findOne').mockReturnValue(event);

      const result = await controller.findOne(event._id);
      expect(result).toEqual(event);
    });

    it('should throw a NotFoundException if event does not exists', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      const callback = () => controller.findOne(event._id);
      await expect(callback).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll()', () => {
    const events = createMany(createEvent, 10);

    it('should return a list of events', async () => {
      jest
        .spyOn(service, 'findAll')
        //@ts-expect-error type missmatch with _id prop
        .mockResolvedValue(events);

      const result = await controller.findAll();
      expect(result).toEqual(events);
    });

    it('should call service.findAll with dateFrom and dateTo filter', async () => {
      //@ts-expect-error type missmatch with _id prop
      jest.spyOn(service, 'findAll').mockResolvedValue(events);

      const query = {
        datesRange: {
          from: dayjs('2024-04-10'),
          to: dayjs('2024-05-12'),
        },
      };

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith({
        dateFrom: query.datesRange.from.toISOString(),
        dateTo: query.datesRange.to.toISOString(),
      });
    });
  });

  describe('update()', () => {
    it('should update event', async () => {
      const updateEventDto = { name: faker.lorem.words() };
      const updatedEvent = { ...event, ...updateEventDto };

      //@ts-expect-error the create method receive a object and should return one Document
      jest.spyOn(service, 'update').mockResolvedValue(updatedEvent);

      const result = await controller.update(event._id, updateEventDto);
      expect(result).toEqual(updatedEvent);
    });

    it('should respond with NotFoundException if event does not exists', async () => {
      jest.spyOn(service, 'update').mockRejectedValue(new NotFoundException());

      const callback = () => controller.update(event._id, {});
      await expect(callback).rejects.toThrow(NotFoundException);
    });

    it('should respond with BadRequestError if try to update an event that overlaps other events', async () => {
      const updateEventDto = { name: faker.lorem.words() };

      jest.spyOn(service, 'update').mockRejectedValue(new EventOverlapError());

      const callback = () => controller.update(event._id, updateEventDto);
      await expect(callback).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove()', () => {
    it('should remove event', async () => {
      //@ts-expect-error type missmatch with _id prop
      jest.spyOn(service, 'remove').mockResolvedValue(event);

      const result = await controller.remove(event._id);
      expect(result).toEqual(event);
    });

    it('should throw a NotFoundException if event does not exists', async () => {
      jest.spyOn(service, 'remove').mockRejectedValue(new NotFoundException());

      const callback = () => controller.remove(event._id);
      await expect(callback).rejects.toThrow(NotFoundException);
    });
  });
});
