import semver from 'semver';

import reduxStore from '../createStore';
import database from '../database';
import log from '../../utils/log';
import { setEnterpriseModules as setEnterpriseModulesAction } from '../../actions/enterpriseModules';

export async function setEnterpriseModules() {
	try {
		const { version: serverVersion, server: serverId } = reduxStore.getState().server;
		if (serverVersion && semver.gte(semver.coerce(serverVersion), '3.1.0')) {
			const serversDB = database.servers;
			const serversCollection = serversDB.collections.get('servers');
			const server = await serversCollection.find(serverId);
			if (server.enterpriseModules) {
				reduxStore.dispatch(setEnterpriseModulesAction(server.enterpriseModules.split(',')));
			}
		}
	} catch (e) {
		log(e);
	}
}

export function getEnterpriseModules() {
	return new Promise(async(resolve) => {
		try {
			const { version: serverVersion, server: serverId } = reduxStore.getState().server;
			if (serverVersion && semver.gte(semver.coerce(serverVersion), '3.1.0')) {
				const enterpriseModules = await this.methodCallWrapper('license:getModules');
				if (enterpriseModules) {
					const serversDB = database.servers;
					const serversCollection = serversDB.collections.get('servers');
					const server = await serversCollection.find(serverId);
					await serversDB.action(async() => {
						await server.update((s) => {
							s.enterpriseModules = enterpriseModules.join(',');
						});
					});
					reduxStore.dispatch(setEnterpriseModulesAction(enterpriseModules));
				}
				return resolve();
			}
		} catch (e) {
			log(e);
		}
		return resolve();
	});
}
