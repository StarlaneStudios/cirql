import { z } from 'zod';
import { Cirql, select } from '../lib';
import { createRecord } from '../lib/writer/create';

// Create a Cirql instance and connect to the database
const cirql = new Cirql({
	connection: {
		namespace: 'test',
		database: 'test',
		endpoint: 'http://localhost:8000'
	},
	credentials: {
		user: 'root',
		pass: 'root'
	},
	logging: true,
	retryCount: -1
});

const query = select()
	.fromRecord('profile', 'john')
	.toQuery();

console.log(query);

const creation = createRecord('profile', 'john')
	.set('name', 'John Doe')
	.setAll({
		age: 30,
		inner: {
			value: true,
			text: "Yes"
		}
	})
	.returnFields('age')
	.toQuery();

console.log(creation);

export const Organisation = z.object({
    id: z.string(),
    name: z.string().min(1)
});

async function testCreate() {
	cirql.create({
		table: 'organisation',
		schema: Organisation,
		data: {
			name: 'Test'
		}
	});
}

async function testDelete() {
	await cirql.prepare()
		.delete({
			table: 'organisation',
			id: ''
		})
		.selectMany({
			query: 'SELECT * FROM organisation',
			schema: Organisation
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

// async function sendQuery() {
// 	try {
// 		const results = await execute();

// 		let output = '';

// 		for (let i = 0; i < results.length; i++) {
// 			output += `
// 				<div><b>Query #${i + 1}</b></div>
// 				<pre>${JSON.stringify(results[i], null, 4)}</pre>
// 				<hr />
// 			`;
// 		}

// 		get('output').innerHTML = output;
// 	} catch(err) {
// 		console.error(err);
		
// 		get('output').innerHTML = `
// 			<div><b>Query failure</div>
// 			<pre style="color: red">${err}</pre>
// 		`;
// 	}

// }

setConnected(false);

get('connect').addEventListener('click', () => {
	cirql.connect();
});

get('disconnect').addEventListener('click', () => {
	cirql.disconnect();
});

get('create').addEventListener('click', () => {
	testCreate();
});

get('delete').addEventListener('click', () => {
	testDelete();
});