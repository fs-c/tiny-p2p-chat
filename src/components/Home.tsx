import { useComputed, useSignal } from '@preact/signals';
import { useLocation } from 'preact-iso';
import { useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact/jsx-runtime';
import { twJoin } from 'tailwind-merge';
import { RefObject } from 'preact';
import { Logo } from './Logo';

function useSplitInput(numberOfInputs: number, inputsContainerRef: RefObject<HTMLElement | null>) {
    // it would in principle be possible to make this reactive to the number of inputs
    // but that would be complicated and realistically when you call this you know how many inputs you have

    const inputs = useSignal<HTMLInputElement[]>([]);

    useEffect(() => {
        if (inputsContainerRef.current == null) {
            return;
        }

        inputs.value = Array.from(inputsContainerRef.current.querySelectorAll('input'));
    }, [inputsContainerRef.current]);

    const valueParts = useSignal<(string | null)[]>(
        Array.from({ length: numberOfInputs }, () => null),
    );

    function onInput(event: JSX.TargetedInputEvent<HTMLInputElement>) {
        const index = inputs.value.indexOf(event.currentTarget);
        if (index === -1) {
            throw new Error('Input not found in inputs');
        }

        const value = event.currentTarget.value[event.currentTarget.value.length - 1];

        const valuePartsCopy = [...valueParts.value];
        valuePartsCopy[index] = value;
        valueParts.value = valuePartsCopy;

        if (value != null && index < inputs.value.length - 1) {
            inputs.value[index + 1]?.focus();
        }
    }

    const value = useComputed(() =>
        valueParts.value.includes(null) ? null : valueParts.value.join(''),
    );

    return { value, valueParts, inputs, onInput };
}

export function Home() {
    const location = useLocation();

    const chatIdLength = 5;
    const chatIdToJoinInputsRef = useRef<HTMLDivElement | null>(null);

    // todo: prevent non-numeric input
    const {
        value: chatIdToJoin,
        valueParts: chatIdToJoinParts,
        inputs: chatIdToJoinInputs,
        onInput: onChatIdToJoinInput,
    } = useSplitInput(chatIdLength, chatIdToJoinInputsRef);

    function onJoinChatFormSubmit() {
        if (chatIdToJoin.value != null) {
            location.route('/chat/' + chatIdToJoin.value);
        }
    }

    function onCreateChat() {
        const newChatId = Math.floor(Math.random() * Math.pow(10, chatIdLength))
            .toString()
            .padStart(5, '0');

        location.route('/chat/' + newChatId + '?create=true');
    }

    return (
        <div
            className={
                'flex min-h-screen flex-col items-center justify-between bg-default bg-cover bg-bottom'
            }
        >
            <Logo className={'p-4'} />

            <div
                className={
                    'flex flex-col items-center justify-center gap-4 rounded-lg bg-gray-400/20 p-4 backdrop-blur-md'
                }
            >
                <form className={'flex flex-col gap-4'} onSubmit={onJoinChatFormSubmit}>
                    <div className={'flex flex-row gap-2'} ref={chatIdToJoinInputsRef}>
                        {/* these are not controlled inputs because we want the placeholder */}
                        {chatIdToJoinParts.value.map((char, index) => (
                            <input
                                key={index}
                                type={'text'}
                                className={twJoin(
                                    'h-14 w-14 rounded-lg border-none bg-transparent text-center text-2xl font-semibold shadow-md ring-1 ring-inset ring-white/60 focus:ring-2 focus:ring-inset focus:ring-primary-purple',
                                    char == null ? 'text-white/50' : 'text-white',
                                )}
                                onFocus={() => chatIdToJoinInputs.value[index]?.select()}
                                onInput={onChatIdToJoinInput}
                                value={char == null ? '0' : char}
                            />
                        ))}
                    </div>

                    <button
                        className={
                            'flex w-full flex-col items-center rounded-lg bg-primary-purple/50 px-4 py-2 text-lg font-semibold shadow-lg backdrop-blur-md'
                        }
                    >
                        <span>Join Chat</span>
                    </button>
                </form>

                <div className={'my-1 flex w-1/2 flex-row items-center gap-2'}>
                    <div className={'h-[1px] flex-grow bg-white/25'} />

                    <p className={'mb-[1px] text-xs font-semibold tracking-widest text-white/50'}>
                        OR
                    </p>

                    <div className={'h-[1px] flex-grow bg-white/25'} />
                </div>

                <button
                    className={
                        'flex w-full flex-col items-center rounded-lg bg-white/25 px-4 py-2 text-lg font-semibold text-white shadow-lg backdrop-hue-rotate-15'
                    }
                    onClick={onCreateChat}
                >
                    Create Chat
                </button>
            </div>

            <div>{/* dummy element to center the above */}</div>
        </div>
    );
}
