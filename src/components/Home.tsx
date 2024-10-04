import { batch, useSignal } from '@preact/signals';
import { useLocation } from 'preact-iso';
import { useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact/jsx-runtime';
import { ChatBubbleLeftRight } from '../icons/ChatBubbleLeftRight';

export function Home() {
    const chatId = useSignal<string>('00000');

    const chatIdInputsRef = useRef<HTMLDivElement | null>(null);
    const chatIdInputs = useSignal<HTMLInputElement[]>([]);

    const location = useLocation();

    useEffect(() => {
        if (chatIdInputsRef.current == null) {
            return;
        }

        const inputs = Array.from(chatIdInputsRef.current.querySelectorAll('input'));
        chatIdInputs.value = inputs;
    }, [chatIdInputsRef.current]);

    function onChatIdInput(event: JSX.TargetedEvent<HTMLInputElement>, index: number) {
        // in general, the input value will always be a single character because we immediately
        // focus the next input when a character is entered
        // we can't do this for the last input, so we just get the last entered character and
        // overwrite the current input value with it later
        const value = event.currentTarget?.value[event.currentTarget.value.length - 1];
        batch(() => {
            chatId.value = chatId.value
                .split('')
                .map((char, i) => (i === index ? value[0] : char))
                .join('');

            if (index < chatIdInputs.value.length - 1) {
                chatIdInputs.value[index + 1]?.focus();
            } else {
                const currentInputElement = chatIdInputs.value[index];
                if (currentInputElement != null) {
                    currentInputElement.value = value;
                }
            }
        });
    }

    function generateNewChatId() {
        const newChatId = Math.floor(Math.random() * 100000).toString();
        return newChatId.padStart(5, '0');
    }

    return (
        <div
            className={
                'flex min-h-screen flex-col items-center justify-between bg-default bg-cover bg-bottom'
            }
        >
            <div
                className={
                    'flex flex-row items-center justify-center gap-2 justify-self-start rounded-md px-4 py-2'
                }
            >
                <ChatBubbleLeftRight />

                <p className={'mb-1 text-white'}>
                    <span className={'opacity-70'}>tiny</span>
                    <span className={'font-semibold'}>chat</span>
                </p>
            </div>

            <div
                className={
                    'flex flex-col items-center justify-center gap-4 rounded-lg bg-gray-400/20 p-4 backdrop-blur-md'
                }
            >
                <div className={'flex flex-row gap-2'} ref={chatIdInputsRef}>
                    {/* these are not controlled inputs because we want the placeholder */}
                    {chatId.value.split('').map((char, index) => (
                        <input
                            key={index}
                            type={'text'}
                            className={
                                'h-14 w-14 rounded-lg border-none bg-transparent text-center text-2xl font-semibold text-white shadow-md ring-1 ring-inset ring-white/50 placeholder:text-white/50 focus:ring-2 focus:ring-inset focus:ring-primary-purple'
                            }
                            placeholder={'0'}
                            onFocus={() => chatIdInputs.value[index]?.select()}
                            onInput={(event) => onChatIdInput(event, index)}
                        />
                    ))}
                </div>

                <button
                    className={
                        'flex w-full flex-col items-center rounded-lg bg-primary-purple/50 px-4 py-2 text-lg font-semibold shadow-lg backdrop-blur-md'
                    }
                    onClick={() => location.route('/chat/' + chatId.value)}
                >
                    <span>Join Chat</span>
                </button>

                <div className={'my-2 h-[1px] w-1/2 bg-white/50'}></div>

                <button
                    className={
                        'flex w-full flex-col items-center rounded-lg bg-white/25 px-4 py-2 text-lg font-semibold text-white shadow-lg backdrop-hue-rotate-15'
                    }
                    onClick={() => location.route('/chat/' + generateNewChatId() + '?create=true')}
                >
                    Create Chat
                </button>
            </div>

            {/* dummy element to center the above */}
            <div></div>
        </div>
    );
}
