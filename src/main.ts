import { z } from 'zod';
import { Cirql, raw } from '../lib';
import { select } from '../lib/writer/select';

// Create a Cirql instance and connect to the database
const cirql = new Cirql({
	connection: {
		namespace: 'test',
		database: 'test',
		endpoint: 'http://localhost:8000',
		password: 'root',
		username: 'root'
	},
	logging: true,
	retryCount: -1
});

// Use Zod to define our model schema
const AlertBanner = z.object({
	"backgroundColor": z.string(),
	"content": z.string(),
	"createdAt": z.string(),
	"filter": z.any().array().optional(),
	"orderNumber": z.number(),
	"target": z.string()
});

// Execute a selectOne, count, and create query
function execute() {
	return cirql.prepare()
		.selectOne({ 
			query: select().from('alertBanner').limit(1),
			schema: AlertBanner
		})
		.count({
			table: 'alertBanner',
		})
		.create({
			table: 'alertBanner',
			schema: AlertBanner,
			data: {
				content: 'Alpha beta',
				backgroundColor: 'red',
				createdAt: raw('time::now()'),
				orderNumber: 1,
				target: 'https://google.com',
			}
		})
		.execute();
}

cirql.addEventListener('open', () => {
	setConnected(true);
});

cirql.addEventListener('close', () => {
	setConnected(false);
});

// -- Initialization --

function get(id: string) {
	return document.getElementById(id)!;
}

function setConnected(connected: boolean) {
	const text = get('status');
	const send = get('send');

	text.innerText = connected ? 'SurrealDB connection active' : 'Not connected';
	text.style.color = connected ? 'green' : 'red';
	
	if (connected) {
		send.removeAttribute('disabled');
	} else {
		send.setAttribute('disabled', '');
	}
}

async function sendQuery() {
	try {
		const results = await execute();

		let output = '';

		for (let i = 0; i < results.length; i++) {
			output += `
				<div><b>Query #${i + 1}</b></div>
				<pre>${JSON.stringify(results[i], null, 4)}</pre>
				<hr />
			`;
		}

		get('output').innerHTML = output;
	} catch(err) {
		console.error(err);
		
		get('output').innerHTML = `
			<div><b>Query failure</div>
			<pre style="color: red">${err}</pre>
		`;
	}
}

setConnected(false);

get('connect').addEventListener('click', () => {
	cirql.connect();
});

get('disconnect').addEventListener('click', () => {
	cirql.disconnect();
});

get('send').addEventListener('click', () => {
	sendQuery();
});