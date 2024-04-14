import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import * as dayjs from 'dayjs';

export type DatesRangeQuery = {
  datesRange?: {
    from: dayjs.Dayjs;
    to: dayjs.Dayjs;
  };
};

@Injectable()
export class ParseDatesRangeQueryPipe
  implements PipeTransform<object, DatesRangeQuery>
{
  transform(value: object, metadata: ArgumentMetadata) {
    if (metadata.type === 'query' && 'datesRange' in value) {
      const dates = this.parseJson(value.datesRange as string);

      const from = dayjs(dates[0]);
      const to = dayjs(dates[1]);

      if (!from.isValid() || !to.isValid()) {
        throw new BadRequestException({
          error: 'Invalid Dates Range',
          message: 'Invalid dates given.',
        });
      }

      if (from.diff(to) > 0) {
        throw new BadRequestException({
          error: 'Invalid Dates Range',
          message:
            'Second date element of the array cannot be less then first date element',
        });
      }

      return {
        ...value,
        datesRange: { from, to },
      };
    }

    return value;
  }

  private parseJson(value: string) {
    try {
      const parsed = JSON.parse(value) as [string, string];

      if (!Array.isArray(parsed)) {
        throw new Error('Not valid json array');
      }

      return parsed;
    } catch (error) {
      throw new BadRequestException(
        {
          error: 'Invalid Dates Range',
          message: 'datesRange query should be a valid json array.',
        },
        { cause: error },
      );
    }
  }
}
