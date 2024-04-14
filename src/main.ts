import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ExceptionFilter } from './exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: { origin: '*' } });
  const configService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({ exceptionFactory }));

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new ExceptionFilter(httpAdapter));

  await app.listen(configService.get('APP_PORT'));
}
bootstrap();

export function exceptionFactory(validationErrors) {
  const errors = validationErrors.reduce((errors, error) => {
    errors[error.property] = Object.values(error.constraints);

    return errors;
  }, {});

  return new BadRequestException({ errors });
}
