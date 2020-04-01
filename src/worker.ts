import { isObject } from './util';

import {
  gzipEncode
} from '../jinge-wasm-utility';

function hello(name: unknown): string {
  return 'hello, ' + name;
}

const allFns = {
  gzipEncode,
  hello
};

type CallInfo = {
  id: string;
  fn: string;
  args?: unknown[];
};

async function _call(info: CallInfo): Promise<unknown> {
  const args = Array.isArray(info.args) ? info.args : [];
  await allFns[info.fn](...args);
}

self.addEventListener('message', msg => {
  const info = msg.data as CallInfo;
  if (!isObject(info) || !info.id || !info.fn || !(info.fn in allFns)) {
    // eslint-disable-next-line no-console
    console.error('message data invalidate:', info);
    return;
  }
  _call(info).then(result => {
    self.postMessage({
      id: info.id,
      ret: result
    });
  }, err => {
    // eslint-disable-next-line no-console
    console.error('failed to call:' + info.fn, err);
    self.postMessage({
      id: info.id,
      err: err.message || err.toString()
    });
  });
});