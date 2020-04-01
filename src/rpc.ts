import { isObject } from './util';

let INCREMENT = 0;

type CallInfo = {
  id: string; 
  fn: string;
  args: unknown[];
  resolve: Function;
  reject: Function;
  tm: number;
};

const DEFAULT_CALL_TIMEOUT = 30000;

export type RPCOpitons = {
  timeout: number;
};

export class WorkerRPCServer {
  timeout: number;
  wait: Map<string, CallInfo>; 
  constructor(public worker: Worker, {
    timeout = DEFAULT_CALL_TIMEOUT
  }: RPCOpitons = {
    timeout: DEFAULT_CALL_TIMEOUT
  }) {
    this.timeout = timeout;
    this.wait = new Map();
    this.worker.addEventListener('message', this._onMessage.bind(this));
  }
  _onMessage(msg: MessageEvent): void {
    const result = msg.data as {
      id: string;
      ret?: unknown;
      err?: string;
    };
    if (!isObject(result) || !result.id) {
      // eslint-disable-next-line no-console
      console.error('message data is invalidate', msg.data);
      return;
    }
    const info = this.wait.get(result.id);
    if (!info) {
      return;
    }
    if (result.err) {
      info.reject(new Error(result.err));
    } else {
      info.resolve(result.ret);
    }
    this._clear(info);
  }
  _onTimeout(info: CallInfo): void {
    if (!info || !info.id || !this.wait.has(info.id)) {
      return;
    }
    // eslint-disable-next-line no-console
    console.error('RPC call timeout:', info.id, info.fn, info.args);
    info.reject(new Error('RPC call timeout.'));
    this._clear(info);
  }
  _clear(info: CallInfo): void {
    this.wait.delete(info.id);
    if (info.tm) {
      clearTimeout(info.tm);
      info.tm = 0;
    }
    info.args =
      info.resolve = 
      info.reject = null;
  }
  callFn(functionName: string, ...args: unknown[]): void {
    const id = (INCREMENT++).toString(32);
    const info = {
      id,
      fn: functionName,
      args,
      resolve: null,
      reject: null,
      tm: 0
    };
    const p = new Promise((resolve, reject) => {
      info.resolve = resolve;
      info.reject = reject;
    });
    info.tm = setTimeout(() => {
      this._handleTimeout(info);
    }, this.timeout);
    this.wait.set(id, info);
    this.worker.postMessage({
      id,
      fn: functionName,
      args
    });
    return p;
  }
}
