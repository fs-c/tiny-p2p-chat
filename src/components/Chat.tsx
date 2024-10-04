import './chat.css';

import { useSignal } from '@preact/signals';
import { useRoute } from 'preact-iso';
import { useChatConnection } from '../chat/chat-connection';
import { PaperAirplaneIcon } from '../icons/PaperAirplaneIcon';
import { useEffect, useRef } from 'preact/hooks';
import { ChatBubbleLeftRight } from '../icons/ChatBubbleLeftRight';
import { RefObject } from 'preact';
import { debounceWithAnimationFrame } from '../util/debounce';
import { InlineChatEvent } from './InlineChatEvent';

function useStoreScrollPosition(elementRef: RefObject<HTMLElement | null>) {
    const storeCurrentScrollPosition = debounceWithAnimationFrame(() => {
        if (elementRef.current != null) {
            document.documentElement.dataset.scrollTop = elementRef.current.scrollTop.toString();
        }
    });

    useEffect(() => {
        storeCurrentScrollPosition();
    }, [elementRef.current]);

    return storeCurrentScrollPosition;
}

export function Chat() {
    const route = useRoute();

    const chatId = route.params.chatId;
    const createChatDistributor = route.query.create === 'true';

    const eventsContainerRef = useRef<HTMLDivElement | null>(null);

    const { sendMessage, chatEvents } = useChatConnection({
        chatId,
        createChatDistributor,
    });

    useEffect(() => {
        eventsContainerRef.current?.scrollTo({
            top: eventsContainerRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, [eventsContainerRef.current, chatEvents.value]);

    const storeCurrentScrollPosition = useStoreScrollPosition(eventsContainerRef);

    const newChatMessage = useSignal('');

    function onSendMessage() {
        sendMessage(newChatMessage.value);
        newChatMessage.value = '';
    }

    return (
        <div
            className={'flex h-screen flex-col overflow-scroll bg-default bg-cover bg-bottom'}
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

                <span className={'font-mono tracking-widest opacity-70'}>{chatId}</span>
            </div>

            <div className={'mx-auto w-full max-w-screen-md flex-grow'}>
                {chatEvents.value.map((event, index) => (
                    <InlineChatEvent key={index} event={event} />
                ))}
            </div>

            <div className={'sticky bottom-0 bg-primary-purple/50 p-4 backdrop-blur-sm'}>
                <div className={'mx-auto flex max-w-screen-md flex-row gap-2'}>
                    <input
                        type={'text'}
                        className={
                            'flex-grow rounded-md border-none bg-white/25 text-white focus:ring-primary-purple'
                        }
                        value={newChatMessage}
                        onChange={(event) => (newChatMessage.value = event.currentTarget.value)}
                    />

                    <button
                        className={
                            'sticky bottom-0 aspect-square rounded-md bg-primary-purple/50 p-2 font-semibold text-purple-100'
                        }
                        onClick={onSendMessage}
                    >
                        <PaperAirplaneIcon />
                    </button>
                </div>
            </div>
        </div>
    );
}
