import type { FrontendChatEvent } from './Chat';

function formatTimestamp(timestamp: Date) {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const displayEvents = ['join', 'leave', 'chat-created', 'message'];

export function FrontendChatEvent({ event }: { event: FrontendChatEvent }) {
    const formattedTimestamp = formatTimestamp(event.timestamp);

    if (!displayEvents.includes(event.type)) {
        return <></>;
    }

    return (
        <div className={'flex flex-col rounded-md bg-white/15 px-4 py-2 backdrop-blur-md'}>
            <div className={'flex flex-row items-center justify-between'}>
                <span className={'text-sm font-semibold text-white/75'}>
                    <span className={'font-mono'}>{event.displayName}</span>

                    {event.type === 'join' && <span className={'text-white'}>{' joined'}</span>}
                    {event.type === 'leave' && <span className={'text-white'}>{' left'}</span>}
                    {event.type === 'chat-created' && (
                        <span className={'text-white'}>{' created the chat'}</span>
                    )}
                </span>
                <span className={'text-sm text-white/75'}>{formattedTimestamp}</span>
            </div>

            {event.type === 'message' && <span className={'text-white'}>{event.message}</span>}

            {event.type === 'chat-created' && (
                <>
                    <p className={'text-md text-white'}>
                        <span className={'font-semibold'}>Your chat has been created!</span> Share
                        the chat ID with others to let them join.
                    </p>

                    <div className={'flex flex-row items-center justify-center gap-2 p-4'}>
                        {event.chatId.split('').map((char, index) => (
                            <div
                                key={index}
                                className={
                                    'flex h-14 w-14 items-center justify-center rounded-lg border border-white/50 text-center text-2xl font-semibold text-white'
                                }
                            >
                                {char}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
