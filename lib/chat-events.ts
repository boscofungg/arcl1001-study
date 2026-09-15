import type { Source } from './retrieval';
export type ChatEvent =
  | {type:'status';message:string}
  | {type:'metadata';sources:Source[];visualsUsed?:number;visualWarning?:string}
  | {type:'delta';text:string}
  | {type:'done'}
  | {type:'error';message:string};
export function encodeChatEvent(event:ChatEvent):Uint8Array {
  return new TextEncoder().encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}
