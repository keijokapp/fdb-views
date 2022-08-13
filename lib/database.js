import assert from 'assert';
import * as fdb from 'foundationdb';

// This needs to be called before opening the database.
// At the time of writing this comment, the latest API version is 630.
fdb.setAPIVersion(630);

const database = fdb.open()
	.withKeyEncoding(fdb.encoders.tuple)
	.withValueEncoding(fdb.encoders.json);

function map([modelName, ...key], value, emit) {
	if (modelName === 'primary') {
		emit(['secondary', value.secondary], key[0]);
	}
}

export default function transaction(fn) {
	return database.doTn(async tn => {
		const { tn: wrappedTransaction, drainViewUpdates } = wrapTransaction(tn, ['viewKey']);

		const result = await fn(wrappedTransaction);

		await drainViewUpdates();

		return result;
	});
}

function wrapTransaction(tn, viewKeyPrefix) {
	const viewKeyTransaction = tn.at(tn.subspace.at(viewKeyPrefix));
	let viewUpdatePromise = Promise.resolve();
	let viewUpdateLockCount = 0;

	async function drainViewUpdates() {
		while (viewUpdateLockCount) {
			await viewUpdatePromise;
		}
	}

	function updateView(key, value) {
		const view = [];

		map(key, value, (viewKey, viewValue) => {
			view.push([viewKey, viewValue]);
		});

		viewUpdateLockCount++;

		const promise = viewKeyTransaction.getRangeAllStartsWith(key)
			.then(indexes => {
				indexes.forEach(([, viewKey]) => {
					tn.clear(viewKey);
				});

				viewKeyTransaction.clearRange(key);

				view.forEach(([viewKey, viewValue]) => {
					tn.set(viewKey, viewValue);
					viewKeyTransaction.set(key, viewKey);
					console.log('Add view key', key, viewKey);
				});
			})
			.finally(() => { viewUpdateLockCount--; });

		viewUpdatePromise = Promise.all([viewUpdatePromise, promise]);
	}

	function clearView(begin, end) {
		viewUpdateLockCount++;

		const promise = viewKeyTransaction.getRangeAll(['primary'], end)
			.then(indexes => {
				indexes.forEach(([k, viewKey]) => {
					console.log('Removing view key', k, viewKey);
					tn.clear(viewKey);
				});

				viewKeyTransaction.clearRange(begin, end);
			})
			.finally(() => { viewUpdateLockCount--; });

		viewUpdatePromise = Promise.all([viewUpdatePromise, promise]);
	}

	function wrap(tn) {
		return Object.assign(
			Object.create(tn),
			{
				at(subspace) {
					const newTransaction = tn.at(subspace);

					return wrap(newTransaction);
				},

				async getRangeNative(...args) {
					await drainViewUpdates();

					return tn.getRangeNative(...args);
				},

				set(key, value) {
					tn.set(key, value);

					// eslint-disable-next-line no-underscore-dangle
					updateView(key, value);
				},

				clear(key) {
					tn.clear(key);

					// eslint-disable-next-line no-underscore-dangle
					clearView(key);
				},

				clearRange(start, end) {
					tn.clearRange(start, end);

					clearView(start, end);
				}
			}
		);
	}

	return {
		tn: wrap(tn),
		drainViewUpdates
	};
}

transaction(async tn => {
	await tn.getReadVersion();
	tn.clearRangeStartsWith([]);

	tn.set(['primary', 0], {
		secondary: 'secondary0'
	});

	console.log(await tn.getRangeAllStartsWith(['primary']));
	console.log(await tn.getRangeAllStartsWith(['primary', 0]));


	return;
	tn.set(['primary', 1], {
		secondary: 'secondary1'
	});

	tn.set(['primary', 2], {
		secondary: 'secondary2'
	});

	let primary;
	let secondary;

	primary = await tn.getRangeAllStartsWith(['primary']);
	secondary = await tn.getRangeAllStartsWith(['secondary']);

	console.log('view keys', await tn.getRangeAll(['viewKey', 'primary']));

	assert.deepStrictEqual(primary, [
		[['primary', 0], { secondary: 'secondary0' }],
		[['primary', 1], { secondary: 'secondary1' }],
		[['primary', 2], { secondary: 'secondary2' }]
	]);
	assert.deepStrictEqual(secondary, [
		[['secondary', 'secondary0'], 0],
		[['secondary', 'secondary1'], 1],
		[['secondary', 'secondary2'], 2]
	]);

	tn.clear(['primary', 1]);

	primary = await tn.getRangeAllStartsWith(['primary']);
	secondary = await tn.getRangeAllStartsWith(['secondary']);

	console.log('view keys', await tn.getRangeAll(['viewKey']));

	assert.deepStrictEqual(primary, [
		[['primary', 0], { secondary: 'secondary0' }],
		[['primary', 2], { secondary: 'secondary2' }]
	]);
	assert.deepStrictEqual(secondary, [
		[['secondary', 'secondary0'], 0],
		[['secondary', 'secondary2'], 2]
	]);

	tn.clearRangeStartsWith(['primary']);

	primary = await tn.getRangeAllStartsWith(['primary']);
	secondary = await tn.getRangeAllStartsWith(['secondary']);

	assert.deepStrictEqual(primary, []);
	assert.deepStrictEqual(secondary, []);
});
