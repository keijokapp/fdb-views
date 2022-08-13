import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export const validator = new Ajv({ allErrors: true, strictTuples: false });
addFormats(validator);

export function timeout(ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}
