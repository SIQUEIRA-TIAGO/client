/**
 * Rejeita se a promise não resolver dentro do prazo. A operação subjacente
 * não é cancelada (ex.: a query continua no banco), mas o chamador é
 * liberado e o erro fica visível em vez de pendurar o tick para sempre.
 */
export const withTimeout = <T>(
    promise: Promise<T>,
    ms: number,
    label: string
): Promise<T> => {
    let timer: NodeJS.Timeout | undefined;
    return Promise.race([
        promise.finally(() => clearTimeout(timer)),
        new Promise<never>((_, reject) => {
            timer = setTimeout(
                () => reject(new Error(`Timeout after ${ms}ms: ${label}`)),
                ms
            );
        }),
    ]);
};
