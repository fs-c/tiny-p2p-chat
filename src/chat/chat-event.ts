import { z } from 'zod';

const BaseChatEvent = z.object({ sender: z.string(), timestamp: z.coerce.date() });

export const ChatEvent = z.discriminatedUnion('type', [
    BaseChatEvent.extend({ type: z.literal('message'), message: z.string() }),
    BaseChatEvent.extend({ type: z.literal('join') }),
    BaseChatEvent.extend({ type: z.literal('leave') }),
]);

export type ChatEvent = z.infer<typeof ChatEvent>;
