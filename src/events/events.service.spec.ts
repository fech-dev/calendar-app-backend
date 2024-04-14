import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { faker } from '@faker-js/faker';
import { createMany } from '../../utils/test/factories';
import { createEvent, getCreateEventDto } from './factories/event.factory';
import { Event } from './event.schema';
import { NotFoundError } from '../errors/not-found.error';
import { EventOverlapError } from './errors/event-overlap-error';

describe('EventsService', () => {
  let service: EventsService;
  let model: Model<Event>;

  let event: ReturnType<typeof createEvent>;

  const eventModelMock = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getModelToken('Event'),
          useValue: eventModelMock,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    model = module.get<Model<Event>>(getModelToken(Event.name));

    event = createEvent();
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', function () {
    it('should create event', async () => {
      const createEventDto = getCreateEventDto(event);

      //@ts-expect-error the create method receive a object and should return one Document
      jest.spyOn(model, 'create').mockResolvedValue(event);
      jest.spyOn(service, 'hasOverlappingEvents').mockResolvedValue(false);

      const result = await service.create(createEventDto);
      expect(result).toEqual(event);
    });

    it('should throw a EventOverlapError', async () => {
      const createEventDto = getCreateEventDto(event);

      jest.spyOn(service, 'hasOverlappingEvents').mockResolvedValue(true);

      const callback = () => service.create(createEventDto);
      await expect(callback).rejects.toThrow(EventOverlapError);
    });
  });

  describe('findOne()', () => {
    it('should get event', async () => {
      jest.spyOn(model, 'findById').mockResolvedValue(event);

      const result = await service.findOne(event._id);
      expect(result).toEqual(event);
    });

    it('should throw a NotFoundError exception', async () => {
      jest.spyOn(model, 'findById').mockRejectedValue(new NotFoundError());

      const callback = () => service.findOne(event._id);

      await expect(callback).rejects.toThrow(NotFoundError);
    });
  });

  describe('findAll()', () => {
    let events: ReturnType<typeof createEvent>[];

    beforeEach(() => {
      events = createMany(createEvent, 10);
      jest.spyOn(model, 'find').mockResolvedValue(events);
    });

    it('should get a list of events', async () => {
      const result = await service.findAll();
      expect(result).toEqual(events);
    });

    it('should create an dates range query', async () => {
      const refDate = faker.date.soon();
      const filter = {
        dateFrom: refDate.toISOString(),
        dateTo: faker.date.soon({ refDate }).toISOString(),
      };

      await service.findAll(filter);

      expect(model.find).toHaveBeenCalledWith({
        start: {
          $gte: filter.dateFrom,
          $lte: filter.dateTo,
        },
      });
    });
  });

  describe('update()', () => {
    it('should update event', async () => {
      const updateEventDto = { name: faker.lorem.words() };
      const updatedEvent = {
        ...event,
        ...updateEventDto,
      };

      jest.spyOn(service, 'hasOverlappingEvents').mockResolvedValue(false);
      jest
        .spyOn(model, 'findById')
        .mockResolvedValueOnce({
          ...event,
          updateOne: jest.fn(),
        })
        .mockResolvedValueOnce(updatedEvent);

      const result = await service.update(event._id, updateEventDto);

      expect(result).toEqual(updatedEvent);
    });

    it('should throw a NotFoundError exception', async () => {
      const updateEventDto = { name: faker.lorem.words() };

      jest.spyOn(model, 'findById').mockRejectedValue(new NotFoundError());

      const callback = () => service.update(event._id, updateEventDto);
      await expect(callback).rejects.toThrow(NotFoundError);
    });

    it('should throw a EventOverlapError', async () => {
      const updateEventDto = { name: faker.lorem.words() };

      jest.spyOn(model, 'findById').mockResolvedValue(event);
      jest.spyOn(service, 'hasOverlappingEvents').mockResolvedValue(true);

      const callback = () => service.update(event._id, updateEventDto);
      await expect(callback).rejects.toThrow(EventOverlapError);
      expect(service.hasOverlappingEvents).toHaveBeenCalledWith(
        [event.start, event.end],
        [event._id],
      );
    });
  });

  describe('remove()', () => {
    it('should remove event', async () => {
      jest.spyOn(model, 'findByIdAndDelete').mockResolvedValue(event);

      const result = await service.remove(event._id);
      expect(result).toEqual(event);
    });

    it('should throw a NotFoundError exception', async () => {
      jest
        .spyOn(model, 'findByIdAndDelete')
        .mockRejectedValue(new NotFoundError());

      const callback = () => service.remove(event._id);

      expect(callback).rejects.toThrow(NotFoundError);
    });
  });
});
