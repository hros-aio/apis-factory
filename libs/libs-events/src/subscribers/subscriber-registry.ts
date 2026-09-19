import { DynamicModule, Module, Type } from '@nestjs/common';

@Module({})
export class SubscriberModule {
  static register(handlers: Type<any>[]): DynamicModule {
    return {
      module: SubscriberModule,
      controllers: handlers,
      imports: [],
    };
  }
}
