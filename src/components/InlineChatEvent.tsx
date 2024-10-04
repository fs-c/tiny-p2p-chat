import type { ChatEvent } from '../chat/chat-event';

function formatTimestamp(timestamp: Date) {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// can't just call it ChatEvent because that's the name of the type (╯°□°）╯︵ ┻━┻
export function InlineChatEvent({ event }: { event: ChatEvent }) {
    const formattedTimestamp = formatTimestamp(event.timestamp);
    const displayName = event.sender.slice(0, event.sender.indexOf('-'));

    return (
        <div
            className={'mx-2 my-2 flex flex-col rounded-md bg-white/15 px-4 py-2 backdrop-blur-md'}
        >
            <div className={'flex flex-row items-center justify-between'}>
                <span className={'text-sm font-semibold text-white/75'}>
                    <span className={'font-mono'}>{displayName}</span>

                    {event.type === 'join' && <span className={'text-white'}>{' joined'}</span>}
                </span>
                <span className={'text-sm text-white/75'}>{formattedTimestamp}</span>
            </div>

            {event.type === 'message' && (
                <span className={'text-md text-white'}>{event.message}</span>
            )}
        </div>
    );
}
