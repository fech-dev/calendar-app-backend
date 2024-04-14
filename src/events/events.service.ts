import { FilterQuery, Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as dayjs from 'dayjs';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './event.schema';
import { NotFoundError } from '../errors/not-found.error';
import { EventOverlapError } from './errors/event-overlap-error';

interface FindAllFilter {
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<Event>,
  ) {}

  /**
   * Checks if there are some overlapping events in the given datesRange
   * @param startDate
   * @param endDate
   * @param ignoreEventIds Event ids to ignore
   * @returns true if there are overlapping events, false if not.
   */
  async hasOverlappingEvents(
    datesRange: [Date, Date],
    ignoreEventIds: string[] = [],
  ): Promise<boolean> {
    const [startDate, endDate] = datesRange;

    const query: FilterQuery<Event> = {
      end: { $gt: startDate },
      start: { $lt: endDate },
      _id: { $nin: ignoreEventIds },
    };

    const overlappingEventsCount = await this.eventModel.countDocuments(query);

    return overlappingEventsCount > 0;
  }

  async create(createEventDto: CreateEventDto) {
    const hasOverlappingEvents = await this.hasOverlappingEvents([
      dayjs(createEventDto.start).toDate(),
      dayjs(createEventDto.end).toDate(),
    ]);

    if (hasOverlappingEvents) {
      throw new EventOverlapError();
    }

    const event = await this.eventModel.create(createEventDto);
    return event;
  }

  async findAll(filter: FindAllFilter = {}) {
    const queryFilter: FilterQuery<Event> = {};

    if (filter.dateFrom && filter.dateTo) {
      queryFilter.start = {
        $gte: filter.dateFrom,
        $lte: filter.dateTo,
      };
    }

    const events = await this.eventModel.find(queryFilter);

    return events;
  }

  async findOne(id: string) {
    const event = await this.eventModel.findById(id);

    if (!event) {
      throw new NotFoundError();
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    let event = await this.eventModel.findById(id);

    if (!event) {
      throw new NotFoundError();
    }

    const eventDatesRange: [Date, Date] = [
      updateEventDto.start ? dayjs(updateEventDto.start).toDate() : event.start,
      updateEventDto.end ? dayjs(updateEventDto.end).toDate() : event.end,
    ];

    if (await this.hasOverlappingEvents(eventDatesRange, [id])) {
      throw new EventOverlapError();
    }

    await event.updateOne(updateEventDto);

    event = await this.eventModel.findById(id);

    return event;
  }

  async remove(id: string) {
    const event = await this.eventModel.findByIdAndDelete(id);

    if (!event) {
      throw new NotFoundError();
    }

    return event;
  }
}
