<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	// Props
	export let hasImage: boolean = false;
	export let isProcessing: boolean = false;
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		upload: File;
		reset: void;
		export: 'png' | 'jpeg';
	}>();
	
	// File input reference
	let fileInput: HTMLInputElement;
	
	function handleUploadClick() {
		fileInput?.click();
	}
	
	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (file && file.type.startsWith('image/')) {
			dispatch('upload', file);
		}
		
		// Reset input để có thể upload lại cùng file
		target.value = '';
	}
	
	function handleReset() {
		dispatch('reset');
	}
	
	function handleExport(format: 'png' | 'jpeg') {
		dispatch('export', format);
	}
	
	// Keyboard shortcut hints
	const shortcuts = {
		upload: 'Ctrl+O',
		reset: 'Ctrl+R',
		export: 'Ctrl+S',
	};
</script>

<div class="toolbar">
	<!-- Hidden file input -->
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		on:change={handleFileChange}
		class="hidden-input"
	/>
	
	<!-- Action Buttons -->
	<button 
		class="btn-primary flex-1"
		on:click={handleUploadClick}
		disabled={isProcessing}
		title="Upload ảnh ({shortcuts.upload})"
	>
		<span>📁</span>
		<span>Upload</span>
	</button>
	
	<button 
		class="btn-ghost"
		on:click={handleReset}
		disabled={!hasImage || isProcessing}
		title="Reset về ảnh gốc ({shortcuts.reset})"
	>
		<span>🔄</span>
		<span>Reset</span>
	</button>
	
	<button 
		class="btn-secondary flex-1"
		on:click={() => handleExport('png')}
		disabled={!hasImage || isProcessing}
		title="Export ảnh ({shortcuts.export})"
	>
		<span>💾</span>
		<span>Export</span>
	</button>
</div>

<style>
	.toolbar {
		display: flex;
		gap: 0.75rem;
		align-items: stretch;
	}
	
	.hidden-input {
		position: absolute;
		width: 0;
		height: 0;
		opacity: 0;
		pointer-events: none;
	}
	
	/* Make buttons stretch equally */
	.flex-1 {
		flex: 1;
	}
	
	/* Disabled state */
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none !important;
	}
	
	button:disabled:hover {
		transform: none !important;
	}
</style>

