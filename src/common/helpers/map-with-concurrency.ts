/**
 * Executa fn para cada item com no máximo `limit` execuções simultâneas,
 * para não saturar o pool de conexões do banco quando muitos observers
 * vencem no mesmo minuto. fn não deve rejeitar (trate erros internamente).
 */
export const mapWithConcurrency = async <T, R>(
    items: T[],
    limit: number,
    fn: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
    const results: R[] = new Array(items.length);
    let nextIndex = 0;

    const workers = Array.from(
        { length: Math.max(1, Math.min(limit, items.length)) },
        async () => {
            while (nextIndex < items.length) {
                const index = nextIndex++;
                results[index] = await fn(items[index], index);
            }
        }
    );

    await Promise.all(workers);
    return results;
};
