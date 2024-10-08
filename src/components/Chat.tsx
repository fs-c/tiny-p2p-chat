import './chat.css';

import { ReadonlySignal, useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { useRoute } from 'preact-iso';
import { useChatConnection } from '../chat/chat-connection';
import { PaperAirplaneIcon } from '../icons/PaperAirplaneIcon';
import { useEffect, useRef } from 'preact/hooks';
import { RefObject } from 'preact';
import { debounceWithAnimationFrame } from '../util/debounce';
import { FrontendChatEvent } from './FrontendChatEvent';
import { Logo } from './Logo';
import { ChatEvent } from '../chat/chat-event';
import { twMerge } from 'tailwind-merge';

export type FrontendChatEvent = ChatEvent & { displayName: string };

function scrollElementToBottom(element: HTMLElement) {
    element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth',
    });
}

function senderIdToDisplayNameWithDefault(
    senderId: string,
    senderIdToDisplayName: Map<string, string>,
) {
    return senderIdToDisplayName.get(senderId) ?? senderId.slice(0, senderId.indexOf('-'));
}

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

function ChatEventList({
    frontendChatEvents,
    className,
}: {
    frontendChatEvents: ReadonlySignal<FrontendChatEvent[]>;
    className: string;
}) {
    return (
        <div className={twMerge('flex flex-col gap-2 px-2', className)}>
            {frontendChatEvents.value.map((event, index) => (
                <FrontendChatEvent key={index} event={event} />
            ))}
        </div>
    );
}

export function Chat() {
    const route = useRoute();

    const chatId = route.params.chatId;
    const createChatDistributor = route.query.create === 'true';

    const eventsContainerRef = useRef<HTMLDivElement | null>(null);

    const { sendMessage, chatEvents, changeDisplayName, senderIdToDisplayName, ownPeerId } =
        useChatConnection({
            chatId,
            createChatDistributor,
        });

    const currentDisplayName = useComputed(() =>
        ownPeerId.value != null
            ? senderIdToDisplayNameWithDefault(ownPeerId.value, senderIdToDisplayName.value)
            : 'disconnected',
    );

    const frontendChatEvents = useComputed(() =>
        chatEvents.value.map(
            (event) =>
                ({
                    ...event,
                    displayName: senderIdToDisplayNameWithDefault(
                        event.sender,
                        senderIdToDisplayName.value,
                    ),
                }) satisfies FrontendChatEvent,
        ),
    );

    // for some reason when including chatEvents.value in the dependency array
    // everything works but then the component re-renders on every chat event
    useEffect(() => {
        if (eventsContainerRef.current != null) {
            scrollElementToBottom(eventsContainerRef.current);
        }
    }, [eventsContainerRef.current]);

    useSignalEffect(() => {
        chatEvents.value; // trigger effect when chatEvents change

        // apparently useSignalEffect fires before the DOM is updated so the new
        // event is not yet there, with this hack we let the DOM update first
        queueMicrotask(() => {
            if (eventsContainerRef.current != null) {
                scrollElementToBottom(eventsContainerRef.current);
            }
        });
    });

    const storeCurrentScrollPosition = useStoreScrollPosition(eventsContainerRef);

    const newChatMessage = useSignal('');

    function onSendMessageFormSubmit(event: Event) {
        sendMessage(newChatMessage.value);
        newChatMessage.value = '';

        event.preventDefault();
    }

    const newDisplayName = useSignal('');

    function onChangeDisplayNameFormSubmit(event: Event) {
        changeDisplayName(newDisplayName.value);

        event.preventDefault();
    }

    return (
        <div
            className={
                'relative flex h-screen flex-col overflow-scroll bg-default bg-cover bg-bottom'
            }
            ref={eventsContainerRef}
            onScroll={storeCurrentScrollPosition}
        >
            <div
                id={'chat-header'}
                className={
                    'sticky top-0 z-10 flex flex-row items-center justify-between gap-2 px-6 py-4'
                }
            >
                <Logo />

                <span className={'font-mono tracking-widest opacity-70'}>{chatId}</span>
            </div>

            <div className={'mx-auto w-full max-w-screen-md px-2 pb-4'}>
                <form
                    className={
                        'flex flex-col gap-4 rounded-md rounded-b-md bg-white/15 p-4 backdrop-blur-md'
                    }
                    onSubmit={onChangeDisplayNameFormSubmit}
                >
                    <p>
                        <span className={'text-white/75'}>You are chatting as</span>
                        <span
                            className={'font-semibold text-white'}
                        >{` ${currentDisplayName.value}`}</span>
                    </p>

                    <input
                        type={'text'}
                        className={
                            'rounded-md border-none bg-white/25 text-white placeholder:text-white/60'
                        }
                        value={newDisplayName}
                        onChange={(event) => (newDisplayName.value = event.currentTarget.value)}
                        placeholder={'Anonymous Hedgehog'}
                    />

                    <button
                        className={'rounded-md bg-primary-purple/50 p-2 font-semibold text-white'}
                    >
                        Change Name
                    </button>
                </form>
            </div>

            <ChatEventList
                frontendChatEvents={frontendChatEvents}
                className={'mx-auto w-full max-w-screen-md flex-grow'}
            />

            <div className={'sticky bottom-0 bg-primary-purple/50 p-2 backdrop-blur-sm md:py-4'}>
                <form
                    className={'mx-auto flex max-w-screen-md flex-row gap-2'}
                    onSubmit={onSendMessageFormSubmit}
                >
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
                            'sticky bottom-0 aspect-square rounded-md bg-primary-purple/50 p-2 font-semibold'
                        }
                    >
                        <PaperAirplaneIcon />
                    </button>
                </form>
            </div>
        </div>
    );
}
