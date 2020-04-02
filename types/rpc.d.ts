export declare type RPCOpitons = {
    timeout: number;
};
export declare class RPC {
    private timeout;
    private wait;
    private remote;
    constructor(remote: Worker, { timeout }?: RPCOpitons);
    private _onMessage;
    private _onTimeout;
    private _clear;
    callFn(functionName: string, ...args: unknown[]): Promise<unknown>;
}
