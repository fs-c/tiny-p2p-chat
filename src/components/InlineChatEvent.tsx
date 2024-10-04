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
                        <span className={'font-semibold'}>Your chat has been created!</span> Others
                        can connect to it using the ID
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
