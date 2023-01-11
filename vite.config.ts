import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		lib: {
			entry: './lib/index.ts',
			name: 'Cirql',
			fileName: 'Cirql'
		},
		rollupOptions: {
			external: ['zod', 'isomorphic-ws'],
			output: {
				globals: {
					'zod': 'Zod',
					'isomorphic-ws': 'WebSocket'
				},
			},
		}
	}
})
