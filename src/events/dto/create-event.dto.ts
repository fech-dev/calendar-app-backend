import { IsString, IsBoolean, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  allDay: boolean;

  @IsDateString()
  start: string;

  @IsDateString()
  end: string;
}
