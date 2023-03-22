import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Ctx, EventPattern } from '@nestjs/microservices';
import { AmqpContext } from './servertest';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('test')
  test_event(msg: any) {
    console.log(
      'the msg is properly passed to the method test_event(msg: any)',
    );
    console.log(msg);
  }

  @EventPattern('test2')
  test2_event(msg: any, @Ctx() context: AmqpContext) {
    console.log('but if we add @Ctx(), the msg is now undefined');
    console.log(msg);
  }
}
