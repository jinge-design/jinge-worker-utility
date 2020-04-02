declare module 'worker-loader!*' {
  interface WorkerConstructor {
    new(): Worker;
  }
  type Imported = {
    default: WorkerConstructor;
  };
  export = Imported;
}
