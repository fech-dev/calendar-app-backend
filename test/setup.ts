import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { exceptionFactory } from '../src/main';

export async function setupE2EApplication() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ exceptionFactory }));
  await app.init();

  return app;
}
