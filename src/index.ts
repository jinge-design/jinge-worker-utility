import {
  RPC
} from './rpc';

let rpc: RPC;
let __waiting__: Promise<void>;

function __init__(): Promise<void> {
  if (rpc) {
    return Promise.resolve();
  }
  if (!__waiting__) {
    __waiting__ = import('worker-loader!./worker').then(MyWorker => {
      rpc = new RPC(
        new MyWorker.default()
      );
      __waiting__ = null;
    });
  }
  return __waiting__;
}

async function __call__(functionName: string, ...args: unknown[]): Promise<unknown> {
  await __init__();
  return await rpc.callFn(functionName, ...args);
}

export async function hello(name: string = 'xiaoge'): Promise<string> {
  return await __call__('hello', name) as string;
}

export async function bsonEncode(json: unknown): Promise<ArrayBuffer> {
  return await __call__('bsonEncode', json) as ArrayBuffer;
}

export async function bsonDecode(input: { gziped: boolean; buffer: ArrayBuffer }): Promise<unknown> {
  return await __call__('bsonDecode', input);
}