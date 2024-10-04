import './chat.css';

import { useSignal } from '@preact/signals';
import { useRoute } from 'preact-iso';
import { useChatConnection } from '../chat/chat-connection';
import { InlineChatEvent } from './InlineChatEvent';
import { PaperAirplaneIcon } from '../icons/PaperAirplaneIcon';
import { useEffect, useRef } from 'preact/hooks';
import { ChatBubbleLeftRight } from '../icons/ChatBubbleLeftRight';

const debounce = (fn: any) => {
    let frame: number | null = null;

    return (...params: any) => {
        if (frame != null) {
            cancelAnimationFrame(frame);
        }

        frame = requestAnimationFrame(() => {
            fn(...params);
        });
    };
};

export function Chat() {
    const route = useRoute();

    const chatId = route.params.chatId;
    const createChatDistributor = route.query.create === 'true';

    const eventsContainerRef = useRef<HTMLDivElement | null>(null);

    const { sendMessage, chatEvents } = useChatConnection({
        chatId,
        createChatDistributor,
    });

    const storeCurrentScrollPosition = debounce(() => {
        if (eventsContainerRef.current != null) {
            document.documentElement.dataset.scrollTop =
                eventsContainerRef.current.scrollTop.toString();
        }
    });

    useEffect(() => {
        eventsContainerRef.current?.scrollTo({
            top: eventsContainerRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, [eventsContainerRef.current, chatEvents.value]);

    const newChatMessage = useSignal('');

    function onSendMessage() {
        sendMessage(newChatMessage.value);
        newChatMessage.value = '';
    }

    return (
        <div
            className={'bg-default flex h-screen flex-col overflow-scroll bg-cover'}
            ref={eventsContainerRef}
            onScroll={storeCurrentScrollPosition}
        >
            <div
                id={'chat-header'}
                className={'sticky top-0 z-10 flex flex-row items-center justify-between gap-2 p-4'}
            >
                <div className={'flex flex-row items-center justify-center gap-2'}>
                    <ChatBubbleLeftRight />

                    <p className={'mb-1 text-white'}>
                        <span className={'opacity-70'}>tiny</span>
                        <span className={'font-semibold'}>chat</span>
                    </p>
                </div>

                <span className={'font-mono font-semibold tracking-widest opacity-70'}>
                    {chatId}
                </span>
            </div>

            <div className={'flex-grow'}>
                {chatEvents.value.map((event, index) => (
                    <InlineChatEvent key={index} event={event} />
                ))}
            </div>

            <div
                className={
                    'bg-primary-purple/50 sticky bottom-0 flex flex-row gap-2 p-4 backdrop-blur-sm'
                }
            >
                <input
                    type={'text'}
                    className={
                        'focus:ring-primary-purple flex-grow rounded-md border-none bg-white/25 text-white'
                    }
                    value={newChatMessage}
                    onChange={(event) => (newChatMessage.value = event.currentTarget.value)}
                />

                <button
                    className={
                        'bg-primary-purple/50 sticky bottom-0 aspect-square rounded-md p-2 font-semibold text-purple-100'
                    }
                    onClick={onSendMessage}
                >
                    <PaperAirplaneIcon />
                </button>
            </div>
        </div>
    );
}
