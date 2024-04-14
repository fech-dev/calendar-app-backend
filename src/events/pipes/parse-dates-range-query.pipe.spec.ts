import { BadRequestException } from '@nestjs/common';
import { ParseDatesRangeQueryPipe } from './parse-dates-range-query.pipe';

describe('ParseDatesRangeQueryPipe', () => {
  let pipe: ParseDatesRangeQueryPipe;

  beforeEach(() => {
    pipe = new ParseDatesRangeQueryPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should throw a BadRequestError if "to" date is less then "from" date', () => {
    const callback = () =>
      pipe.transform(
        { datesRange: '["2024-04-13", "2024-04-10"]' },
        { type: 'query' },
      );

    expect(callback).toThrow(BadRequestException);
  });

  it('should throw if invalid json array given', () => {
    const callback = () =>
      pipe.transform(
        { datesRange: '{"from" :"2024-04-13", "to": "2024-04-10"}' },
        { type: 'query' },
      );

    expect(callback).toThrow();
  });

  it('should not throw if dates are given correctly', () => {
    const callback = () =>
      pipe.transform(
        { datesRange: '["2024-04-13","2024-04-15"]' },
        { type: 'query' },
      );

    expect(callback).not.toThrow();
  });

  it('should throw if invalid json given', () => {
    const callback = () =>
      pipe.transform({ datesRange: 'sadalj' }, { type: 'query' });

    expect(callback).toThrow(BadRequestException);
  });

  it('should throw if invalid json given', () => {
    const callback = () =>
      pipe.transform(
        { datesRange: '["saldkjf", "asdljskda"]' },
        { type: 'query' },
      );

    expect(callback).toThrow(BadRequestException);
  });
});
