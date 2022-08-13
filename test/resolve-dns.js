// This file is executed synchronously by database initialization code to resolve coordinators'
// hostnames. Its only purpose is to enable resolving DNS names synchronously. This can be
// reimplemented using "global await" once it becomes more widely supported.

import dns from 'dns';

const hostnames = process.argv.slice(3);

Promise.all(hostnames.map(host => new Promise((resolve, reject) => {
	dns.lookup(host, { family: 4 }, (e, d) => {
		if (e) {
			reject(e);
		} else {
			resolve(d);
		}
	});
})))
	.then(hosts => {
		// eslint-disable-next-line no-console
		console.log(JSON.stringify(hosts));
	});
