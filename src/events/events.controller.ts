import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UsePipes,
  BadRequestException,
} from '@nestjs/common';
import {
  DatesRangeQuery,
  ParseDatesRangeQueryPipe,
} from './pipes/parse-dates-range-query.pipe';
import { EventOverlapError } from './errors/event-overlap-error';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

interface FindAllQuery extends DatesRangeQuery {}

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  async create(@Body() createEventDto: CreateEventDto) {
    try {
      const event = await this.eventsService.create(createEventDto);

      return event;
    } catch (error) {
      if (error instanceof EventOverlapError) {
        throw new BadRequestException({
          error: error.name,
          message:
            'Cannot create event, other overlapping events detected. Please choose another date slot.',
        });
      }
    }
  }

  @Get()
  @UsePipes(ParseDatesRangeQueryPipe)
  async findAll(@Query() query: FindAllQuery = {}) {
    const filter = {
      dateFrom: query.datesRange?.from.toISOString(),
      dateTo: query.datesRange?.to.toISOString(),
    };

    const events = await this.eventsService.findAll(filter);

    return events;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const event = await this.eventsService.findOne(id);

    return event;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    try {
      const event = await this.eventsService.update(id, updateEventDto);

      return event;
    } catch (error) {
      if (error instanceof EventOverlapError) {
        throw new BadRequestException({
          error: error.name,
          message:
            'Cannot update event, other overlapping events detected. Please choose another date slot.',
        });
      }

      throw error;
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}
