import { faker } from '@faker-js/faker';
import { defineFactory } from '../../../utils/test/factories';
import { Event } from '../event.schema';
import { CreateEventDto } from '../dto/create-event.dto';

/**
 * Create an Event
 */
export const createEvent = defineFactory<Event & { _id: string }>(() => {
  const startDate = faker.date.soon();

  return {
    _id: faker.database.mongodbObjectId(),
    name: faker.lorem.words(),
    allDay: false,
    start: startDate,
    end: faker.date.soon({ refDate: startDate }),
  };
});

/**
 * Create an Event with all day time slot
 */
export const createAllDayEvent = defineFactory<Event & { _id: string }>(() => {
  const startDate = faker.date.soon();
  startDate.setHours(0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setHours(23, 59, 59);

  return createEvent(() => ({
    allDay: true,
    start: startDate,
    end: endDate,
  }));
});

/**
 * generate a CreateEventDto from a event object
 * @param event event object
 * @returns DTO instance
 */
export const getCreateEventDto = (
  event: Event & { _id: string } = createEvent(),
) => {
  const dto = new CreateEventDto();

  dto.name = event.name;
  dto.allDay = event.allDay;
  dto.start = event.start.toJSON();
  dto.end = event.end.toJSON();

  return dto;
};
