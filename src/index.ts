import {
  WorkerRPCServer
} from './rpc';

let rpc: WorkerRPCServer;

async function __init__(): void {
  if (rpc) return;

  const Worker = await import('./worker');
  worker = new Worker();
  rpc = new WorkerRPCServer(worker);
}

export async function hello(name: string = 'xiaoge'): string {
  await __init__();
  return await rpc.callFn('hello', name);
}
