type AsyncFn = (...args: any[]) => Promise<any>;

type HandleFunctionReturn<
    T extends AsyncFn,
    E = unknown
> =
    | [Awaited<ReturnType<T>>, null]
    | [null, E];

export async function handleFunction<
    T extends AsyncFn,
    E = unknown
>(
    fn: T,
    ...args: Parameters<T>
): Promise<HandleFunctionReturn<T, E>> {
    try {
        const data = await fn(...args);
        return [data, null];
    } catch (error) {
        return [null, error as E];
    }
}

export async function handlePromise<T, E = unknown>(
    promise: Promise<T>
): Promise<[T, null] | [null, E]> {
    try {
        const data = await promise;
        return [data, null];
    } catch (error) {
        return [null, error as E];
    }
}
