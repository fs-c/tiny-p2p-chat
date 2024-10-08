import { twMerge } from 'tailwind-merge';
import { ChatBubbleLeftRight } from '../icons/ChatBubbleLeftRight';
import { useLocation } from 'preact-iso';
import { preventDefault } from '../util/preventDefault';

export function Logo({ className }: { className?: string }) {
    const location = useLocation();

    return (
        <a
            className={twMerge('flex flex-row items-center justify-center gap-2', className)}
            onClick={preventDefault(() => location.route('/'))}
            href={'/'}
        >
            <ChatBubbleLeftRight />

            {/* add a little bit of bottom margin to the text to make it look balanced with the icon */}
            <p className={'mb-1 text-white'}>
                <span className={'opacity-70'}>tiny</span>
                <span className={'font-semibold'}>chat</span>
            </p>
        </a>
    );
}
