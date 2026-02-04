<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { FilterState } from '$lib/canvas/filters';

	// Props
	export let isOpen = false;
	export let currentFilters: FilterState;
	export let editingPreset: { name: string; emoji: string; description: string } | null = null;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		save: { name: string; emoji: string; description: string; filters: FilterState };
		cancel: void;
	}>();

	// Form state
	let presetName = '';
	let presetEmoji = '💾';
	let presetDescription = '';
	let errorMessage = '';

	// Common emojis for presets
	const emojiOptions = ['💾', '⭐', '✨', '🎨', '🌈', '🌅', '❄️', '📻', '🎭', '🌸', '🖤', '🎬', '👤', '🏔️', '🌊', '🌙', '☀️', '🔥', '💎', '🎯'];

	// Reset form when modal opens or editing preset changes
	$: if (isOpen) {
		if (editingPreset) {
			// Pre-fill form with editing preset data
			presetName = editingPreset.name;
			presetEmoji = editingPreset.emoji;
			presetDescription = editingPreset.description;
		} else {
			// Reset form for new preset
			presetName = '';
			presetEmoji = '💾';
			presetDescription = '';
		}
		errorMessage = '';
	}

	function handleSave() {
		// Validate
		if (!presetName.trim()) {
			errorMessage = 'Vui lòng nhập tên preset';
			return;
		}

		if (presetName.length > 50) {
			errorMessage = 'Tên preset không được quá 50 ký tự';
			return;
		}

		// Dispatch save event
		dispatch('save', {
			name: presetName.trim(),
			emoji: presetEmoji,
			description: presetDescription.trim(),
			filters: currentFilters,
		});

		// Reset form
		presetName = '';
		presetEmoji = '💾';
		presetDescription = '';
		errorMessage = '';
	}

	function handleCancel() {
		dispatch('cancel');
		presetName = '';
		presetEmoji = '💾';
		presetDescription = '';
		errorMessage = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleCancel();
		} else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
			handleSave();
		}
	}
</script>

{#if isOpen}
	<div class="modal-overlay" on:click={handleCancel} on:keydown={handleKeydown} role="dialog" aria-modal="true" aria-labelledby="save-preset-title">
		<div class="modal-content" on:click|stopPropagation>
			<!-- Header -->
			<div class="modal-header">
				<h3 id="save-preset-title" class="modal-title">
					<span class="modal-icon">💾</span>
					<span>Lưu Preset</span>
				</h3>
				<button class="modal-close" on:click={handleCancel} aria-label="Đóng">
					✕
				</button>
			</div>

			<!-- Form -->
			<div class="modal-body">
				<!-- Preset Name -->
				<div class="form-group">
					<label for="preset-name" class="form-label">
						Tên preset <span class="required">*</span>
					</label>
					<input
						id="preset-name"
						type="text"
						class="form-input"
						class:error={errorMessage && !presetName.trim()}
						placeholder="Ví dụ: My Favorite Preset"
						bind:value={presetName}
						maxlength="50"
						autofocus
					/>
					{#if errorMessage && !presetName.trim()}
						<span class="error-message">{errorMessage}</span>
					{/if}
				</div>

				<!-- Emoji -->
				<div class="form-group">
					<label for="preset-emoji" class="form-label">Emoji</label>
					<div class="emoji-selector">
						<input
							id="preset-emoji"
							type="text"
							class="emoji-input"
							bind:value={presetEmoji}
							maxlength="2"
							placeholder="💾"
						/>
						<div class="emoji-options">
							{#each emojiOptions as emoji}
								<button
									type="button"
									class="emoji-option"
									class:active={presetEmoji === emoji}
									on:click={() => presetEmoji = emoji}
									title={emoji}
								>
									{emoji}
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Description -->
				<div class="form-group">
					<label for="preset-description" class="form-label">Mô tả (tùy chọn)</label>
					<textarea
						id="preset-description"
						class="form-textarea"
						placeholder="Mô tả về preset này..."
						bind:value={presetDescription}
						maxlength="200"
						rows="3"
					></textarea>
					<span class="char-count">{presetDescription.length}/200</span>
				</div>
			</div>

			<!-- Actions -->
			<div class="modal-actions">
				<button class="btn btn-secondary" on:click={handleCancel}>
					Hủy
				</button>
				<button class="btn btn-primary" on:click={handleSave}>
					💾 Lưu
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		backdrop-filter: blur(4px);
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-content {
		background: var(--color-surface-50);
		border-radius: var(--radius-cartoon);
		padding: 24px;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		animation: slideUp 0.3s ease;
		max-height: 90vh;
		overflow-y: auto;
	}

	:global(.dark) .modal-content {
		background: var(--color-surface-800);
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;
	}

	.modal-title {
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 20px;
		font-weight: 600;
		color: var(--color-surface-800);
		margin: 0;
	}

	:global(.dark) .modal-title {
		color: var(--color-surface-100);
	}

	.modal-icon {
		font-size: 24px;
	}

	.modal-close {
		background: transparent;
		border: none;
		font-size: 24px;
		color: var(--color-surface-500);
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 8px;
		transition: all 150ms ease;
		line-height: 1;
	}

	.modal-close:hover {
		background: var(--color-surface-200);
		color: var(--color-surface-700);
	}

	:global(.dark) .modal-close:hover {
		background: var(--color-surface-700);
		color: var(--color-surface-200);
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-bottom: 20px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.form-label {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-surface-700);
	}

	:global(.dark) .form-label {
		color: var(--color-surface-300);
	}

	.required {
		color: var(--color-error-500);
	}

	.form-input,
	.form-textarea {
		padding: 12px;
		border: 2px solid var(--color-surface-200);
		border-radius: var(--radius-cartoon);
		font-size: 14px;
		background: var(--color-surface-50);
		color: var(--color-surface-800);
		transition: all 150ms ease;
		font-family: inherit;
	}

	:global(.dark) .form-input,
	:global(.dark) .form-textarea {
		background: var(--color-surface-700);
		border-color: var(--color-surface-600);
		color: var(--color-surface-100);
	}

	.form-input:focus,
	.form-textarea:focus {
		outline: none;
		border-color: var(--color-accent-400);
		box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
	}

	.form-input.error {
		border-color: var(--color-error-500);
	}

	.form-textarea {
		resize: vertical;
		min-height: 80px;
	}

	.char-count {
		font-size: 12px;
		color: var(--color-surface-500);
		text-align: right;
	}

	:global(.dark) .char-count {
		color: var(--color-surface-400);
	}

	.error-message {
		font-size: 12px;
		color: var(--color-error-600);
		margin-top: -4px;
	}

	:global(.dark) .error-message {
		color: var(--color-error-400);
	}

	.emoji-selector {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.emoji-input {
		width: 80px;
		text-align: center;
		font-size: 24px;
		padding: 8px;
	}

	.emoji-options {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 12px;
		background: var(--color-surface-100);
		border-radius: var(--radius-cartoon);
		max-height: 120px;
		overflow-y: auto;
	}

	:global(.dark) .emoji-options {
		background: var(--color-surface-700);
	}

	.emoji-option {
		background: var(--color-surface-50);
		border: 2px solid transparent;
		border-radius: 8px;
		padding: 8px;
		font-size: 20px;
		cursor: pointer;
		transition: all 150ms ease;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.dark) .emoji-option {
		background: var(--color-surface-800);
	}

	.emoji-option:hover {
		transform: scale(1.1);
		background: var(--color-accent-50);
		border-color: var(--color-accent-200);
	}

	:global(.dark) .emoji-option:hover {
		background: rgba(249, 115, 22, 0.15);
		border-color: var(--color-accent-400);
	}

	.emoji-option.active {
		background: var(--color-accent-100);
		border-color: var(--color-accent-400);
		box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2);
	}

	:global(.dark) .emoji-option.active {
		background: rgba(249, 115, 22, 0.25);
	}

	.modal-actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}

	.btn {
		padding: 10px 20px;
		border-radius: var(--radius-cartoon);
		font-weight: 600;
		cursor: pointer;
		transition: all 150ms ease;
		border: none;
		font-size: 14px;
	}

	.btn-primary {
		background: var(--color-accent-500);
		color: white;
	}

	.btn-primary:hover {
		background: var(--color-accent-600);
		transform: scale(1.05);
	}

	.btn-secondary {
		background: var(--color-surface-200);
		color: var(--color-surface-700);
	}

	.btn-secondary:hover {
		background: var(--color-surface-300);
		transform: scale(1.05);
	}

	:global(.dark) .btn-secondary {
		background: var(--color-surface-700);
		color: var(--color-surface-200);
	}

	:global(.dark) .btn-secondary:hover {
		background: var(--color-surface-600);
	}
</style>

