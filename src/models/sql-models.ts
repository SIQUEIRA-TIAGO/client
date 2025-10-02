import pg from "pg";
import { databaseConnection } from '@/data-sources/connectors/database-connector';

function mapPgType(typeId: number): string {
    const { builtins } = pg.types;
    switch (typeId) {
        case builtins.INT2:
        case builtins.INT4:
        case builtins.INT8:
        case builtins.FLOAT4:
        case builtins.FLOAT8:
        case builtins.NUMERIC:
        return "number";
        case builtins.VARCHAR:
        case builtins.TEXT:
        case builtins.BPCHAR:
        case builtins.UUID:
        return "string";
        case builtins.BOOL:
        return "boolean";
        case builtins.DATE:
        case builtins.TIMESTAMP:
        case builtins.TIMESTAMPTZ:
        return "Date";
        case builtins.JSON:
        case builtins.JSONB:
        return "object";
        default:
        return `unknown(${typeId})`;
    }
}

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
        const getFileSizeInMB = (str: string) => {
            return new TextEncoder().encode(str).length / 1_000_000;
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

            if (Array.isArray(meta)) {
                meta?.forEach((item) => {
                    returnResult.push({
                        field: item.name,
                        type: item.dbTypeName,
                    });
                });
            } else if (
                meta &&
                typeof meta === 'object' &&
                'fields' in meta &&
                Array.isArray((meta as any).fields)
            ) {
                (meta as any).fields.forEach((item: any) => {
                    returnResult.push({
                        field: item.name,
                        type: mapPgType(item.dataTypeID),
                    });
                });
            }

            const uniqueReturnResult = [
                ...new Map(
                    returnResult.map((item) => [item.field, item])
                ).values(),
            ];

            const fileTooBig = getFileSizeInMB(JSON.stringify(result)) > 100;

            return {
                query: uniqueReturnResult,
                result: fileTooBig ? null : JSON.stringify(result),
                executionMS: executionTime,
            };
        } catch (error) {
            console.error('SQL Test Error:', error);
            return false;
        }
    },
};
