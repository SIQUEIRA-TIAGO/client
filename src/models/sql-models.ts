import { databaseConnection } from '@/data-sources/connectors/database-connector';

export const sqlModels = {
    test: async ({
        sql,
    }: {
        sql: string;
    }): Promise<
        | false
        | {
              query: { field: string; type: string }[];
              result: string | null;
              executionMS: number;
          }
    > => {
        const getMibs = (str: string) => {
            return Math.ceil(str.length / 1048576);
        };

        try {
            let executionTime = 0;
            let [result, meta] = await databaseConnection.query(sql, {
                benchmark: true,
                logging: (_, timming) => {
                    executionTime = timming ?? 0;
                },
            });
            let returnResult: { field: string; type: string }[] = [];
            const metadata = meta as Array<Record<string, any>>;

            metadata?.map((item) => {
                returnResult.push({
                    field: item.name,
                    type: item.dbTypeName,
                });
            });

            const uniqueReturnResult = [
                ...new Map(
                    returnResult.map((item) => [item.field, item])
                ).values(),
            ];

            const fileTooBig = getMibs(JSON.stringify(result)) > 1;

            return {
                query: uniqueReturnResult,
                result: fileTooBig ? null : JSON.stringify(result),
                executionMS: executionTime,
            };
        } catch (error) {
            return false;
        }
    },
};
