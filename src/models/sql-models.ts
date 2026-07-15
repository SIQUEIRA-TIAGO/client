import pg from "pg";
import { databaseConnection } from '@/data-sources/connectors/database-connector';
import { logger } from '@/logger';

// Firestore rejeita documentos acima de ~1 MiB ("invalid nested entity");
// folga para os demais campos do documento (query, id, executionMS)
const MAX_RESULT_BYTES = 900_000;

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
        const byteLength = (str: string) => {
            return new TextEncoder().encode(str).length;
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

            let rows: any[] = Array.isArray(result)
                ? result
                : result == null
                ? []
                : [result];
            const totalRows = rows.length;
            let resultJson = JSON.stringify(rows);

            // Trunca as linhas até caber no limite, mantendo uma amostra
            while (rows.length > 0 && byteLength(resultJson) > MAX_RESULT_BYTES) {
                const ratio = MAX_RESULT_BYTES / byteLength(resultJson);
                rows = rows.slice(
                    0,
                    Math.min(rows.length - 1, Math.floor(rows.length * ratio))
                );
                resultJson = JSON.stringify(rows);
            }

            if (rows.length < totalRows) {
                logger.warn(
                    `SQL Test: resultado truncado de ${totalRows} para ${rows.length} linhas para caber no limite de 1 MiB do Firestore`
                );
            }

            return {
                query: uniqueReturnResult,
                // Uma única linha maior que o limite: sem amostra possível
                result: totalRows > 0 && rows.length === 0 ? null : resultJson,
                executionMS: executionTime,
            };
        } catch (error) {
            console.error('SQL Test Error:', error);
            return false;
        }
    },
};
