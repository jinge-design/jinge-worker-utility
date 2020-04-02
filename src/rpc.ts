import { isObject, isArrayBuffer } from './util';

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

export class RPC {
  private timeout: number;
  private wait: Map<string, CallInfo>;
  private remote: Worker;

  constructor(remote: Worker, {
    timeout = DEFAULT_CALL_TIMEOUT
  }: RPCOpitons = {
    timeout: DEFAULT_CALL_TIMEOUT
  }) {
    this.timeout = timeout;
    this.wait = new Map();
    this.remote = remote;
    remote.addEventListener('message', this._onMessage.bind(this));
  }

  private _onMessage(msg: MessageEvent): void {
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

  private _onTimeout(info: CallInfo): void {
    if (!info || !info.id || !this.wait.has(info.id)) {
      return;
    }
    // eslint-disable-next-line no-console
    console.error('RPC call timeout:', info.id, info.fn, info.args);
    info.reject(new Error('RPC call timeout.'));
    this._clear(info);
  }

  private _clear(info: CallInfo): void {
    this.wait.delete(info.id);
    if (info.tm) {
      clearTimeout(info.tm);
      info.tm = 0;
    }
    info.args =
      info.resolve = 
      info.reject = null;
  }

  callFn(functionName: string, ...args: unknown[]): Promise<unknown> {
    const id = (INCREMENT++).toString(32);
    const info: CallInfo = {
      id, fn: functionName, args, tm: 0,
      resolve: null, reject: null
    };
    const p = new Promise((resolve, reject) => {
      info.resolve = resolve;
      info.reject = reject;
    });
    info.tm = window.setTimeout(() => {
      this._onTimeout(info);
    }, this.timeout);
    this.wait.set(id, info);
    this.remote.postMessage({
      id, fn: functionName, args
    }, args.filter(v => isArrayBuffer(v)) as Transferable[]);
    return p;
  }
}
