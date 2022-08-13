import * as fdb from 'foundationdb';
import * as models from './models.js';
import * as fdb from 'foundationdb';

// This needs to be called before opening the database.
// At the time of writing this comment, the latest API version is 630.
fdb.setAPIVersion(630);

const database = fdb.open();

const viewSubspace = database.subspace.at(fdb.encoders.tuple.pack('viewKey'));
const subspaces = Object.fromEntries(Object.entries(models).map(([name, { key, value }]) => [
	name,
	database.subspace.at(
		fdb.encoders.tuple.pack(name),
		fdb.encoders.tuple,
		fdb.encoders.json
	)
]));

export function map([modelName, ...key], value, emit) {
	return !Object.entries(models)
		.filter(([, { map, models }]) => map != null && models.includes(modelName))
		.map(([name, { map }]) => map(modelName, key, value, (viewKey, viewValue) => {
			// eslint-disable-next-line no-underscore-dangle
			const key = subspaces[name]._bakedKeyXf.pack(viewKey);
			const value = subspaces[name].valueXf.pack(viewValue);

			emit(key, value);
		}))
		.every(bail => bail === false);
}

export function transaction(fn) {
	return database.doTn(tn => {
		const { tn: wrappedTransaction, drainViewUpdates } = wrapTransaction(tn, () => {
			throw new Error('Should not be called');
		});

		const modelTransactions = Object.fromEntries(Object.keys(models).map(modelName => [
			modelName,
			wrappedTransaction.at(subspaces[modelName], (key, value, emit) => {
				key = [
					modelName,
					// eslint-disable-next-line no-underscore-dangle
					...subspaces[modelName]._bakedKeyXf.unpack(key)
				];

				return map(key, value, emit);
			})
		]));

		const result = await fn(modelTransactions, tn);

		await drainViewUpdates();

		return result;
	});
}

function wrapTransaction(tn, map) {
	const viewKeyTransaction = tn.at(viewSubspace);
	let viewUpdatePromise = Promise.resolve();
	let viewUpdateLockCount = 0;

	async function drainViewUpdates() {
		while (viewUpdateLockCount) {
			await viewUpdatePromise;
		}
	}

	function updateView(map, start, end, update, value) {
		viewUpdateLockCount++;

		const promise = viewKeyTransaction.getRangeAll(start, end)
			.then(indexes => {
				indexes.forEach(([, viewKey]) => {
					tn.clear(viewKey);
				});

				viewKeyTransaction.clearRange(start, end);

				if (update) {
					map(start, value, (viewKey, viewValue) => {
						tn.set(viewKey, viewValue);
						viewKeyTransaction.set(start, viewKey);
					});
				}
			})
			.finally(() => { viewUpdateLockCount--; });

		viewUpdatePromise = Promise.all([viewUpdatePromise, promise]);
	}

	function wrap(tn, map) {
		return Object.assign(
			Object.create(tn),
			{
				at(subspace, map) {
					const newTransaction = tn.at(subspace);

					return wrap(newTransaction, map);
				},

				async getRangeNative(...args) {
					await drainViewUpdates();

					return tn.getRangeNative(...args);
				},

				set(key, value) {
					if (!Array.isArray(key)) {
						key = [key];
					}

					tn.set(key, value);

					const { begin, end } = tn.subspace.packRange(key);

					updateView(map, begin, end, true, value);
				},

				clear(key) {
					if (!Array.isArray(key)) {
						key = [key];
					}

					tn.clear(key);

					const { begin, end } = tn.subspace.packRange(key);

					updateView(map, begin, end);
				},

				clearRange(start, end) {
					if (!Array.isArray(start)) {
						start = [start];
					}

					if (end != null && !Array.isArray(end)) {
						end = [end];
					}

					tn.clearRange(start, end);

					if (end == null) {
						const range = tn.subspace.packRange(start);
						start = range.begin;
						end = range.end;
					} else {
						// eslint-disable-next-line no-underscore-dangle
						start = tn.subspace._bakedKeyXf.pack(start);
						// eslint-disable-next-line no-underscore-dangle
						end = tn.subspace._bakedKeyXf.pack(end);
					}

					updateView(map, start, end);
				}
			}
		);
	}

	return {
		tn: wrap(tn, map),
		drainViewUpdates
	};
}

transaction(async (models, tn) => {
	await tn.getReadVersion();
	tn.clearRange('', '\xff');

	models.user.set('00000000-0000-0000-0000-000000000000', {
		id: '00000000-0000-0000-0000-000000000000',
		email: 'sita@hda.ee',
		name: 'Koer',
		matrixId: '@sita:keijo.ee'
	});

	models.user.set( '00000000-0000-0000-0000-000000000001', {
		id: '00000000-0000-0000-0000-000000000001',
		email: 'sita@hda.ee',
		name: 'Koer',
		matrixId: '@s2ita:keijo.ee'
	});

	models.user.set('00000000-0000-0000-0000-000000000003', {
		id: '00000000-0000-0000-0000-000000000003',
		email: 'sita@hda.ee',
		name: 'Koer',
		matrixId: '@s3ita:keijo.ee'
	});

	console.log('1', await models.matrixUserId.getRangeAllStartsWith([]));

	await models.user.clear('00000000-0000-0000-0000-000000000001');

	console.log('2', await models.matrixUserId.getRangeAllStartsWith([]));

	await models.user.clearRangeStartsWith([]);

	console.log('3', await models.matrixUserId.getRangeAllStartsWith([]));
});
