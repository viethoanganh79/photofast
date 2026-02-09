<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { CustomPreset } from '$lib/presets/customPresets';

	// Props
	export let customPresets: CustomPreset[] = [];
	export let importStatus: { type: 'success' | 'error' | 'info'; message: string } | null = null;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		edit: { presetId: string };
		delete: { presetId: string };
		export: { presetId: string };
		import: { files: FileList };
	}>();

	let hoveredPresetId: string | null = null;
	let showDeleteConfirm: string | null = null;
	let importInput: HTMLInputElement | null = null;

	function handleEdit(presetId: string) {
		dispatch('edit', { presetId });
	}

	function handleDelete(presetId: string) {
		showDeleteConfirm = presetId;
	}

	function confirmDelete(presetId: string) {
		dispatch('delete', { presetId });
		showDeleteConfirm = null;
	}

	function cancelDelete() {
		showDeleteConfirm = null;
	}

	function handleExport(presetId: string) {
		dispatch('export', { presetId });
	}

	function triggerImport() {
		importInput?.click();
	}

	function handleImportChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;
		dispatch('import', { files: input.files });
		input.value = '';
	}
</script>

	<div class="preset-manager">
		<div class="manager-header">
			<h4 class="manager-title">
				<span>😎</span>
				<span>Preset của tôi</span>
			</h4>
			<div class="manager-actions">
				<button class="import-btn" on:click={triggerImport} title="Import preset Lightroom">Import</button>
				<input
					class="import-input"
					type="file"
					accept=".xmp,.lrtemplate"
					multiple
					bind:this={importInput}
					on:change={handleImportChange}
				/>
			</div>
		</div>

		{#if importStatus}
			<div class="import-status {importStatus.type}">
				{importStatus.message}
			</div>
		{/if}

		<div class="preset-list">
			{#each customPresets as preset (preset.id)}
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class="preset-item"
					on:mouseenter={() => hoveredPresetId = preset.id}
					on:mouseleave={() => hoveredPresetId = null}
				>
					<div class="preset-info">
						<span class="preset-emoji">{preset.emoji}</span>
						<div class="preset-details">
							<span class="preset-name">{preset.name}</span>
							{#if preset.description}
								<span class="preset-desc">{preset.description}</span>
							{/if}
						</div>
					</div>

					{#if hoveredPresetId === preset.id}
						<div class="preset-actions">
							<button
								class="action-btn edit-btn"
								on:click={() => handleEdit(preset.id)}
								title="Đổi tên"
							>
								✏️
							</button>
							<button
								class="action-btn export-btn"
								on:click={() => handleExport(preset.id)}
								title="Export"
							>
								📥
							</button>
							<button
								class="action-btn delete-btn"
								on:click={() => handleDelete(preset.id)}
								title="Xóa"
							>
								🗑️
							</button>
						</div>
					{/if}

					{#if showDeleteConfirm === preset.id}
						<div class="delete-confirm">
							<span class="confirm-text">Xóa preset này?</span>
							<div class="confirm-actions">
								<button class="confirm-btn cancel" on:click={cancelDelete}>
									Hủy
								</button>
								<button class="confirm-btn delete" on:click={() => confirmDelete(preset.id)}>
									Xóa
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

<style>
	.preset-manager {
		margin-top: 16px;
		padding-top: 16px;
		border-top: 2px solid var(--color-surface-200);
		/* Tạo stacking context riêng để overlay không bị footer đè lên */
		position: relative;
		z-index: 5;
	}

	:global(.dark) .preset-manager {
		border-top-color: var(--color-surface-700);
	}

	.manager-header {
		margin-bottom: 12px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.manager-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-surface-800);
		margin: 0;
	}

	:global(.dark) .manager-title {
		color: var(--color-surface-300);
	}

	.manager-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.import-btn {
		background: var(--color-accent-500);
		color: white;
		border: none;
		padding: 6px 10px;
		border-radius: var(--radius-cartoon);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.import-btn:hover {
		background: var(--color-accent-600);
		transform: scale(1.03);
	}

	.import-input {
		display: none;
	}

	.import-status {
		padding: 8px 10px;
		border-radius: var(--radius-cartoon);
		font-size: 12px;
		font-weight: 600;
		margin-bottom: 8px;
	}

	.import-status.success {
		background: rgba(16, 185, 129, 0.15);
		color: #065f46;
		border: 1px solid rgba(16, 185, 129, 0.4);
	}

	.import-status.info {
		background: rgba(59, 130, 246, 0.15);
		color: #1e3a8a;
		border: 1px solid rgba(59, 130, 246, 0.35);
	}

	.import-status.error {
		background: rgba(239, 68, 68, 0.15);
		color: #7f1d1d;
		border: 1px solid rgba(239, 68, 68, 0.35);
	}

	:global(.dark) .import-status.success {
		color: #a7f3d0;
		border-color: rgba(16, 185, 129, 0.5);
	}

	:global(.dark) .import-status.info {
		color: #bfdbfe;
		border-color: rgba(59, 130, 246, 0.5);
	}

	:global(.dark) .import-status.error {
		color: #fecaca;
		border-color: rgba(239, 68, 68, 0.5);
	}

	.preset-list {
		display: grid;
		grid-template-columns: 1fr;
		gap: 8px;
	}

	/* Tablet: 2 columns */
	@media (min-width: 640px) {
		.preset-list {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	/* Desktop: 3 columns */
	@media (min-width: 1024px) {
		.preset-list {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.preset-item {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px;
		background: var(--color-surface-100);
		border-radius: var(--radius-cartoon);
		transition: all 150ms ease;
		min-height: 60px;
	}

	:global(.dark) .preset-item {
		background: var(--color-surface-700);
	}

	.preset-item:hover {
		background: var(--color-surface-200);
		transform: scale(1.02);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .preset-item:hover {
		background: var(--color-surface-600);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.preset-info {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;
		min-width: 0;
	}

	.preset-emoji {
		font-size: 20px;
		flex-shrink: 0;
	}

	.preset-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		flex: 1;
	}

	.preset-name {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-surface-800);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.dark) .preset-name {
		color: var(--color-surface-200);
	}

	.preset-desc {
		font-size: 12px;
		color: var(--color-surface-600);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.dark) .preset-desc {
		color: var(--color-surface-400);
	}

	.preset-actions {
		display: flex;
		gap: 4px;
		flex-shrink: 0;
	}

	.action-btn {
		background: transparent;
		border: none;
		font-size: 16px;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 6px;
		transition: all 150ms ease;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
	}

	.action-btn:hover {
		background: var(--color-surface-300);
		transform: scale(1.1);
	}

	:global(.dark) .action-btn:hover {
		background: var(--color-surface-500);
	}

	.delete-confirm {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--color-surface-50);
		border: 2px solid var(--color-accent-200);
		border-radius: var(--radius-cartoon);
		padding: 12px;
		margin-top: 4px;
		/* Cao hơn donate button text (z-index: 1) và các card khác */
		z-index: 50;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		width: 100%;
		box-sizing: border-box;
	}

	:global(.dark) .delete-confirm {
		background: var(--color-surface-800);
		border-color: var(--color-accent-600);
	}

	.confirm-text {
		display: block;
		font-size: 14px;
		color: var(--color-surface-700);
		margin-bottom: 8px;
		font-weight: 600;
	}

	:global(.dark) .confirm-text {
		color: var(--color-surface-200);
	}

	.confirm-actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
	}

	.confirm-btn {
		padding: 10px 20px;
		border-radius: var(--radius-cartoon);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		border: none;
		transition: all 150ms ease;
	}

	.confirm-btn.cancel {
		background: var(--color-surface-200);
		color: var(--color-surface-700);
	}

	.confirm-btn.cancel:hover {
		background: var(--color-surface-300);
		transform: scale(1.05);
	}

	:global(.dark) .confirm-btn.cancel {
		background: var(--color-surface-700);
		color: var(--color-surface-200);
	}

	:global(.dark) .confirm-btn.cancel:hover {
		background: var(--color-surface-600);
	}

	.confirm-btn.delete {
		background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
		color: white;
		box-shadow: 0 2px 4px rgba(249, 115, 22, 0.2);
	}

	.confirm-btn.delete:hover {
		background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
		transform: scale(1.05);
		box-shadow: 0 4px 8px rgba(249, 115, 22, 0.3);
	}
</style>

