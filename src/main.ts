import { Cirql, contains, count, create, createRecord, delRecord, delRelation, EdgeSchema, inside, letValue, param, query, RecordRelation, RecordSchema, relateRelation, select, time, type, updateRelation } from '../lib';
import * as cirql from '../lib';
import { z } from 'zod';

(window as any).cirql = cirql;

// Create a Cirql instance and connect to the database
const database = new Cirql({
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

export const OrganisationSchema = RecordSchema.extend({
    name: z.string().min(1),
	isEnabled: z.boolean(),
	createdAt: z.string()
});

async function execute() {

	const relation: RecordRelation = {
		fromId: 'person:john',
		edge: 'knows',
		toId: type.thing('person', 'david')
	}

	return await database.transaction(
		{
			query: query('INFO FOR DB').with(z.string()).single(),
			validate: false
		},
		{
			query: create('organisation')
				.with(OrganisationSchema)
				.setAll({
					name: 'Test',
					isEnabled: Math.random() > 0.5,
					createdAt: time.now(),
					parent: null
				})
		},
		{
			query: query('SELECT * FROM test')
				.with(RecordSchema)
		},
		{
			query: count('organisation')
		},
		{
			query: select('id')
				.from('organisation')
				.with(RecordSchema)
				.where({ isEnabled: true })
		},
		{
			query: letValue('orgs', select('name').from('organisation')),
		},
		{
			query: select()
				.from('$orgs')
				.withAny(),
		},
		{
			query: createRecord('person', 'john')
				.with(RecordSchema)
				.set('name', 'John')
		},
		{
			query: createRecord('person', 'david')
				.with(RecordSchema)
				.set('name', 'David'),
		},
		{
			query: relateRelation(relation)
				.with(EdgeSchema)
		},
		{
			query: updateRelation(relation)
				.with(EdgeSchema)
				.setAll({
					updated: true
				})
		},
		{
			query: select()
				.fromRelation(relation)
				.with(EdgeSchema)
		},
		{
			query: delRelation(relation)
				.with(EdgeSchema)
		},
		{
			query: letValue('example', ['Alfred', 'Bob', 'John'])
		},
		{
			query: select()
				.from('person')
				.with(RecordSchema)
				.where({
					name: inside(param('example'))
				})
		},
		{
			query: delRecord('person:john')
				.with(RecordSchema)
		},
		{
			query: delRecord('person:david')
				.with(RecordSchema)
		},
		{
			query: select()
				.andQuery('nextShift', select()
					.from('$parent->hasShift->shift')
					.orderBy('startAt')
					.one()
				)
				.fromRecord('profile:kordian')
				.with(RecordSchema)
		},
		{
			query: select()
				.from('organisation')
				.with(OrganisationSchema)
				.orderBy('createdAt')
				.where({
					OR: [
						{
							QUERY: [
								select().from('$parent->hasMember->person'),
								contains('person:john')
							]
						},
						{
							QUERY: [
								select().from('$parent->hasSubOrganisation->organisation'),
								contains('organisation:starlane')
							]
						}
					]
				})
		},
		{
			query: count('unknownTable')
		}
	);
}

database.addEventListener('open', async () => {
	setConnected(true);
});

database.addEventListener('close', () => {
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
			<pre style="color: red">${JSON.stringify(err, null, 4)}</pre>
		`;
	}

}

setConnected(false);

get('connect').addEventListener('click', () => {
	database.connect();
});

get('disconnect').addEventListener('click', () => {
	database.disconnect();
});

get('send').addEventListener('click', () => {
	sendQuery();
});