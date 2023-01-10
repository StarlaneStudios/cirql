import { z } from 'zod';
import Cirql from '../lib';

const cirql = new Cirql({
	connection: {
		namespace: 'test',
		database: 'test',
		endpoint: 'http://localhost:8000',
		password: 'root',
		username: 'root'
	}
});

cirql.addEventListener('open', () => {
	setConnected(true);
});

cirql.addEventListener('close', () => {
	setConnected(false);
});

const Bruh = z.object({ bruh: z.boolean() });

async function sendQuery() {
	const res = await cirql
		.query({ query: '' })
		.selectMany({ query: '', schema: Bruh })
		.selectOne({ query: '', schema: Bruh })
		.query({ query: '' })
		.execute();
}

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