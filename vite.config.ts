import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['fabric']
	},
	// Đảm bảo fabric.js được xử lý đúng
	ssr: {
		noExternal: ['fabric']
	}
});
