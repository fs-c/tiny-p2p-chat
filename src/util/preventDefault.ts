export function preventDefault(fn: (event: Event) => void) {
    return (event: Event) => {
        fn(event);
        event.preventDefault();
    };
}
