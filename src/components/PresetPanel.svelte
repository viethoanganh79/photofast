<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { presets as defaultPresets, type Preset } from '$lib/presets/presets';
	import { getAllPresets, type CustomPreset } from '$lib/presets/customPresets';
	import PresetManager from './PresetManager.svelte';
	
	// Props
	export let activePresetId: string = 'original';
	export let customPresets: CustomPreset[] = [];
	export let importStatus: { type: 'success' | 'error' | 'info'; message: string } | null = null;
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		select: Preset;
		savePreset: void;
		editPreset: { presetId: string };
		deletePreset: { presetId: string };
		exportPreset: { presetId: string };
		importPreset: { files: FileList };
	}>();
	
	// Get all presets (default + custom)
	$: allPresets = getAllPresets(defaultPresets);
	
	function handleSelect(preset: Preset) {
		activePresetId = preset.id;
		dispatch('select', preset);
	}
	
	function handleSavePreset() {
		dispatch('savePreset');
	}
	
	function handleEditPreset(e: CustomEvent<{ presetId: string }>) {
		dispatch('editPreset', e.detail);
	}
	
	function handleDeletePreset(e: CustomEvent<{ presetId: string }>) {
		dispatch('deletePreset', e.detail);
	}
	
	function handleExportPreset(e: CustomEvent<{ presetId: string }>) {
		dispatch('exportPreset', e.detail);
	}

	function handleImportPreset(e: CustomEvent<{ files: FileList }>) {
		dispatch('importPreset', e.detail);
	}
</script>

<div class="preset-panel">
	<div class="panel-header">
		<h3 class="panel-title">
			<span>✨</span>
			<span>Presets</span>
		</h3>
		<button class="save-preset-btn" on:click={handleSavePreset} title="Lưu preset hiện tại">
			💾 Lưu
		</button>
	</div>
	
	<div class="preset-scroll">
		{#each allPresets as preset (preset.id)}
			<button
				class="preset-btn"
				class:active={activePresetId === preset.id}
				class:custom={'isCustom' in preset && preset.isCustom}
				on:click={() => handleSelect(preset)}
				title={preset.description}
			>
				<span class="preset-icon">{preset.emoji}</span>
				<span class="preset-label">{preset.name}</span>
				{#if 'isCustom' in preset && preset.isCustom}
					<span class="custom-badge">⭐</span>
				{/if}
			</button>
		{/each}
	</div>
	
	<!-- Custom Presets Manager -->
	<PresetManager
		{customPresets}
		{importStatus}
		on:edit={handleEditPreset}
		on:delete={handleDeletePreset}
		on:export={handleExportPreset}
		on:import={handleImportPreset}
	/>
</div>

<style>
	.preset-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.panel-header {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	
	.panel-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-surface-800);
		margin: 0;
	}
	
	:global(.dark) .panel-title {
		color: var(--color-surface-300);
	}
	
	.save-preset-btn {
		background: var(--color-accent-500);
		color: white;
		border: none;
		padding: 6px 12px;
		border-radius: var(--radius-cartoon);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 150ms ease;
		white-space: nowrap;
	}
	
	.save-preset-btn:hover {
		background: var(--color-accent-600);
		transform: scale(1.05);
	}
	
	.preset-scroll {
		display: flex;
		gap: 0.5rem;
		overflow-x: hidden;
		padding-bottom: 0.5rem;
		/* Custom scrollbar */
		scrollbar-width: thin;
		scrollbar-color: var(--color-secondary-300) transparent;
	}
	
	.preset-scroll::-webkit-scrollbar {
		height: 6px;
	}
	
	.preset-scroll::-webkit-scrollbar-track {
		background: var(--color-surface-100);
		border-radius: 3px;
	}
	
	.preset-scroll::-webkit-scrollbar-thumb {
		background: var(--color-secondary-300);
		border-radius: 3px;
	}
	
	.preset-scroll::-webkit-scrollbar-thumb:hover {
		background: var(--color-secondary-400);
	}
	
	/* Override preset-btn for horizontal layout */
	.preset-panel :global(.preset-btn) {
		flex-shrink: 0;
		min-width: 80px;
		position: relative;
	}
	
	.preset-btn.custom {
		border: 2px solid var(--color-accent-200);
	}
	
	:global(.dark) .preset-btn.custom {
		border-color: var(--color-accent-600);
	}
	
	.custom-badge {
		position: absolute;
		top: 4px;
		right: 4px;
		font-size: 12px;
		background: var(--color-accent-500);
		border-radius: 50%;
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}
</style>
