import { isObject } from './util';

import {
  gzipEncode, gzipDecode
} from 'jinge-wasm-utility';
import {
  serialize, deserialize
} from 'jinge-bson';

async function hello(name: unknown): Promise<string> {
  return 'hello, ' + name;
}

type EncodeResult = {
  gziped: boolean;
  buffer: ArrayBuffer;
};
async function bsonEncode(json: unknown): Promise<EncodeResult> {
  // let _st = Date.now();
  const bson = serialize(json);
  // console.log('bson serialize time:', Date.now() - _st);
  // console.log(bson.byteLength);
  // _st = Date.now();
  const gzipedBuffer = (await gzipEncode(new Uint8Array(bson))).buffer;
  // console.log('gzip encode time:', Date.now() - _st);
  // console.log(gzipedBuffer.byteLength);
  const gziped = gzipedBuffer.byteLength < bson.byteLength;
  return {
    gziped,
    buffer: gziped ? gzipedBuffer : bson
  };
}

async function bsonDecode(input: EncodeResult): Promise<unknown> {
  // let _st = Date.now();
  const bson = input.gziped ? (await gzipDecode(new Uint8Array(input.buffer))).buffer : input.buffer;
  // console.log('gzip decode time:', Date.now() - _st);
  // _st = Date.now();
  const json = deserialize(bson);
  // console.log('bson deserialize time:', Date.now() - _st);
  return json;
}

const allFns: Record<string, (...args: unknown[]) => Promise<unknown>> = {
  bsonEncode,
  bsonDecode,
  hello
};

type CallInfo = {
  id: string;
  fn: string;
  args?: unknown[];
};

const __ctx__: Worker = self as unknown as Worker;
async function __call__(info: CallInfo): Promise<unknown> {
  const args = Array.isArray(info.args) ? info.args : [];
  return await allFns[info.fn](...args);
}

function loopGetTransfers(v: unknown, transfers: Transferable[]): void {
  if (!isObject(v)) {
    return;
  }
  if (v instanceof ArrayBuffer) {
    transfers.push(v as Transferable);
  } else {
    Object.keys(v).forEach(k => {
      const kv = (v as Record<string, Transferable>)[k];
      loopGetTransfers(kv, transfers);
    });
  }
}

__ctx__.addEventListener('message', function(msg: MessageEvent): void {
  const info = msg.data as CallInfo;
  if (!isObject(info) || !info.id || !info.fn || !(info.fn in allFns)) {
    // eslint-disable-next-line no-console
    console.error('worker got invalid data:', info);
    return;
  }

  __call__(info).then(result => {
    const transfers: Transferable[] = [];
    loopGetTransfers(result, transfers);
    // console.log(transfers);
    // console.log(result);
    __ctx__.postMessage({
      id: info.id, ret: result
    }, transfers);
  }, (err: Error) => {
    // eslint-disable-next-line no-console
    console.error('worker failed to call:' + info.fn, err);
    __ctx__.postMessage({
      id: info.id,
      err: err.message || err.toString()
    });
  });
});
