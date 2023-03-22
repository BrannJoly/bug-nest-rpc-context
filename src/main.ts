import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ServerTest } from './servertest';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice({
    strategy: new ServerTest({}),
  });
  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
