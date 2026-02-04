<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { CustomPreset } from '$lib/presets/customPresets';

	// Props
	export let customPresets: CustomPreset[] = [];

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		edit: { presetId: string };
		delete: { presetId: string };
		export: { presetId: string };
	}>();

	let hoveredPresetId: string | null = null;
	let showDeleteConfirm: string | null = null;

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
</script>

{#if customPresets.length > 0}
	<div class="preset-manager">
		<div class="manager-header">
			<h4 class="manager-title">⭐ Preset của tôi</h4>
		</div>

		<div class="preset-list">
			{#each customPresets as preset (preset.id)}
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
{/if}

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
	}

	.manager-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-surface-700);
		margin: 0;
	}

	:global(.dark) .manager-title {
		color: var(--color-surface-300);
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

