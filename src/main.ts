import Cirql from '../lib';

const cirql = new Cirql({
	connection: {
		namespace: 'cirql',
		database: 'cirql',
		endpoint: 'http://localhost:8080',
		password: 'cirql',
		username: 'cirql'
	}
});