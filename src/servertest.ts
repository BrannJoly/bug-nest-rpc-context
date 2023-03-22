import {
  Server,
  CustomTransportStrategy,
  BaseRpcContext,
} from '@nestjs/microservices';

class TestContextArgs {
  public pattern: string;
}

export class AmqpContext extends BaseRpcContext<TestContextArgs> {
  constructor(args: TestContextArgs) {
    super(args);
  }
}

export class ServerTest extends Server implements CustomTransportStrategy {
  constructor(private readonly options) {
    super();
  }

  public async listen(callback: () => void) {
    this.start(callback);
  }

  public start(callback) {
    for (const [pattern, handler] of this.messageHandlers.entries()) {
      const amqpCtx = new AmqpContext({ pattern: pattern });
      setTimeout(() => handler({ test: 'test' }, amqpCtx), 1000);
    }
    callback();
  }

  public close() {
    console.log('close');
  }
}
