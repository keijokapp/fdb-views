export const viewKeyIdSchema = { type: 'string', format: 'uuid' };
export const audienceSchema = { type: 'string' };
export const threadIdSchema = { type: 'string', minLength: 1 };
export const emailSchema = { type: 'string', format: 'email' };
export const historyIdSchema = { type: 'string' };
export const matrixTransactionIdSchema = { type: 'string', minLength: 1 };
// FIXME: these regexes reject valid server names which are IP's or include port
//  https://matrix.org/docs/spec/appendices#server-name
export const matrixRoomIdSchema = { type: 'string', pattern: '^![a-zA-Z0-9]+:[0-9a-z.-]+$' };
export const matrixUserIdSchema = { type: 'string', pattern: '^@[a-z0-9._=/-]+:[0-9a-z.-]+$' };
export const messageIdSchema = { type: 'string', format: 'uuid' };
export const syncContextIdSchema = { type: 'string', pattern: '^[0-9a-f]{16,16}$' };
export const userIdSchema = { type: 'string', format: 'uuid' };
export const timestampSchema = { type: 'integer', minimum: 0 };
export const incomingMatrixEventIdSchema = { type: 'string', format: 'uuid' };
export const eventSchema = {};
export const incomingMatrixEventBatchTransactionIdSchema = { type: 'string', minLength: 1 };
export const incomingMatrixEventBatchOrderingKeySchema = { type: 'string', pattern: '^[0-9a-f]{16,16}$' };
export const incomingMatrixEventBatchEventOrderingKeySchema = { type: 'integer' };
