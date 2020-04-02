export declare function hello(name?: string): Promise<string>;
export declare function bsonEncode(json: unknown): Promise<ArrayBuffer>;
export declare function bsonDecode(input: {
    gziped: boolean;
    buffer: ArrayBuffer;
}): Promise<unknown>;
