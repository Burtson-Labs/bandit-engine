import type { PathOrFileDescriptor, WriteFileOptions } from "node:fs";

export function ensureDir(path: string): Promise<void>;
export function pathExists(path: string): Promise<boolean>;
export function readdir(path: string): Promise<string[]>;
export function readFile(path: PathOrFileDescriptor): Promise<Buffer>;
export function readFile(path: PathOrFileDescriptor, options: BufferEncoding): Promise<string>;
export function writeFile(
  path: PathOrFileDescriptor,
  data: string | NodeJS.ArrayBufferView,
  options?: WriteFileOptions | BufferEncoding
): Promise<void>;

export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export type JSONArray = JSONValue[];

export const outputJson: (
  file: string,
  data: JSONValue,
  options?: { spaces?: number | string }
) => Promise<void>;

export const readJson: <T = unknown>(file: string) => Promise<T>;

export * from "node:fs";
const fsExtra: {
  ensureDir: typeof ensureDir;
  pathExists: typeof pathExists;
  readdir: typeof readdir;
  readFile: typeof readFile;
  writeFile: typeof writeFile;
  outputJson: typeof outputJson;
  readJson: typeof readJson;
};
export default fsExtra;
