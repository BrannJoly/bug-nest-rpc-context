This app starts a nest microservice with a custom transport strategy, and demonstrates a bug :

There are two handlers in app.controller.ts.

The first one receives the test message without problem.

The second handler received undefined instead.

The only difference between those twœ arguments is that the second one has an injected argument (@Ctx())

I tracked down the issue to rpc-context-creator (https://github.com/nestjs/nest/blob/master/packages/microservices/context/rpc-context-creator.ts)

When I debug, args contains the actual message, so if fnApplyPipes is falsy, everything works ok.
if fnApplyPipes is defined, it maps the injected arguments to initialArgs but completely ignores the "normal" arguments :

I'm not sure whether the bug lies in getParamsMetadata(), mergeParamsMetatypes(), createPipesFn(), or whether we should overwrite undefined args just before calling the handler ?

```typescript
 create(instance, callback, moduleKey, methodName, contextId = constants_3.STATIC_CONTEXT, inquirerId, defaultCallMetadata = rpc_metadata_constants_1.DEFAULT_CALLBACK_METADATA) {
        const contextType = 'rpc';
        const { argsLength, paramtypes, getParamsMetadata } = this.getMetadata(instance, methodName, defaultCallMetadata, contextType);
        const exceptionHandler = this.exceptionFiltersContext.create(instance, callback, moduleKey, contextId, inquirerId);
        const pipes = this.pipesContextCreator.create(instance, callback, moduleKey, contextId, inquirerId);
        const guards = this.guardsContextCreator.create(instance, callback, moduleKey, contextId, inquirerId);
        const interceptors = this.interceptorsContextCreator.create(instance, callback, moduleKey, contextId, inquirerId);
        const paramsMetadata = getParamsMetadata(moduleKey);

        // paramsMetadata = [
        //   {
        //     index: 1,
        //     extractValue: (...args) => paramsFactory.exchangeKeyForValue(numericType, data, args),
        //     type: 6,
        //     data: undefined,
        //     pipes: [
        //     ],
        //   },
        // ]
        const paramsOptions = paramsMetadata /
            ? this.contextUtils.mergeParamsMetatypes(paramsMetadata, paramtypes)
            : [];

        // paramsOptions= [
        //   {
        //     index: 1,
        //     extractValue: (...args) => paramsFactory.exchangeKeyForValue(numericType, data, args),
        //     type: 6,
        //     data: undefined,
        //     pipes: [
        //     ],
        //     metatype: class AmqpContext extends microservices_1.BaseRpcContext {
        //       constructor(args) {
        //           super(args);
        //       }
        //     },
        //   },
        // ]


        const fnApplyPipes = this.createPipesFn(pipes, paramsOptions);
        const fnCanActivate = this.createGuardsFn(guards, instance, callback, contextType);
        const handler = (initialArgs, args) => async () => {
          // initialArgs = [  undefined,  undefined]
          // args = [
          // { test: "test",},
          // { args: {  pattern: "test2", },  },
          //]
            if (fnApplyPipes) {
                await fnApplyPipes(initialArgs, ...args);
                return callback.apply(instance, initialArgs);
            }
            return callback.apply(instance, args);
        };
```

```typescript
    mergeParamsMetatypes(paramsProperties, paramtypes) {
        if (!paramtypes) {
            return paramsProperties;
        }
        return paramsProperties.map(param => (Object.assign(Object.assign({}, param), { metatype: paramtypes[param.index] })));
    }
```

```typescript
 public createPipesFn(
    pipes: PipeTransform[],
    paramsOptions: (ParamProperties & { metatype?: unknown })[],

// paramsOptions = [
//   {
//     index: 1,
//     extractValue: (...args) => paramsFactory.exchangeKeyForValue(numericType, data, args),
//     type: 6,
//     data: undefined,
//     pipes: [
//     ],
//     metatype: class AmqpContext extends microservices_1.BaseRpcContext {
//       constructor(args) {
//           super(args);
//       }
//     },
//   },
// ]

  ) {
    const pipesFn = async (args: unknown[], ...params: unknown[]) => {
      const resolveParamValue = async (
        param: ParamProperties & { metatype?: unknown },
      ) => {
        const {
          index,
          extractValue,
          type,
          data,
          metatype,
          pipes: paramPipes,
        } = param;
        const value = extractValue(...params);

        args[index] = await this.getParamValue(
          value,
          { metatype, type, data },
          pipes.concat(paramPipes),
        );
      };
      await Promise.all(paramsOptions.map(resolveParamValue));
    };
    return paramsOptions.length ? pipesFn : null;
  }
```

## Installation

```bash
$ npm install
$ npm run start:dev
```
