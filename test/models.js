import {
	audienceSchema,
	emailSchema,
	historyIdSchema,
	matrixRoomIdSchema,
	matrixTransactionIdSchema,
	matrixUserIdSchema,
	messageIdSchema,
	syncContextIdSchema,
	userIdSchema,
	timestampSchema,
	incomingMatrixEventIdSchema,
	eventSchema,
	incomingMatrixEventBatchTransactionIdSchema,
	incomingMatrixEventBatchOrderingKeySchema,
	incomingMatrixEventBatchEventOrderingKeySchema,
	threadIdSchema,
	viewKeyIdSchema
} from './schemas.js';

export const matrixUserId = {
	key: [matrixUserIdSchema, viewKeyIdSchema],
	value: userIdSchema,
	models: ['user'],
	map(_, [userId], { matrixId }, emit) {
		emit(matrixId, userId);
	}
};

export const googleAccessToken = {
	key: [userIdSchema],
	value: {
		type: 'object',
		properties: {
			accessToken: { type: 'string' },
			expiryDate: { type: 'integer' }
		},
		additionalProperties: false,
		required: ['accessToken', 'expiryDate']
	}
};

export const googleRefreshToken = {
	key: [userIdSchema],
	value: { type: 'string' }
};

export const historyId = {
	key: [userIdSchema],
	value: historyIdSchema
};

export const mailboxSyncContext = {
	key: [userIdSchema, syncContextIdSchema, timestampSchema, messageIdSchema],
	value: { type: 'null' }
};

export const matrixSyncContext = {
	key: [userIdSchema, syncContextIdSchema, messageIdSchema],
	value: { oneOf: [{ type: 'null' }, matrixTransactionIdSchema] }
};

export const message = {
	// split object
	key: [userIdSchema, messageIdSchema, { type: 'integer', minimum: 0 }],
	value: { type: 'string' }
};

export const puppet = {
	key: [matrixUserIdSchema],
	value: {
		type: 'object',
		properties: {
			user: userIdSchema,
			email: emailSchema
		},
		additionalProperties: false,
		required: ['user', 'email']
	}
};

export const audience = {
	key: [userIdSchema, audienceSchema],
	value: matrixRoomIdSchema
};

export const thread = {
	key: [userIdSchema, threadIdSchema],
	value: matrixRoomIdSchema
};

export const membership = {
	key: [userIdSchema, matrixRoomIdSchema, matrixUserIdSchema],
	value: { type: 'null' }
};

export const user = {
	key: [userIdSchema],
	value: {
		type: 'object',
		properties: {
			id: userIdSchema,
			email: emailSchema,
			name: { type: 'string' },
			matrixId: matrixUserIdSchema
		},
		additionalProperties: false,
		required: ['id', 'email', 'name', 'matrixId']
	}
};

export const userMailboxSyncContext = {
	key: [userIdSchema, syncContextIdSchema],
	value: { type: 'null' }
};

export const userMatrixSyncContext = {
	key: [userIdSchema],
	value: syncContextIdSchema
};

export const userPuppet = {
	key: [userIdSchema, emailSchema],
	value: matrixUserIdSchema
};

export const incomingMatrixEvent = {
	key: [
		incomingMatrixEventBatchOrderingKeySchema,
		incomingMatrixEventBatchEventOrderingKeySchema,
		incomingMatrixEventIdSchema
	],
	value: eventSchema
};

export const incomingMatrixEventBatch = {
	key: [incomingMatrixEventBatchTransactionIdSchema],
	value: { type: 'null' }
};

export const userToCleanup = {
	key: [userIdSchema],
	value: { type: 'null' }
};
