export const debounceWithAnimationFrame = (fn: any) => {
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
