<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	export let isVisible: boolean = false;
	export let steps: Array<{
		name: string;
		status: 'pending' | 'in-progress' | 'success' | 'error';
		message?: string;
		preview?: string; // dataURL preview
	}> = [];
	
	const dispatch = createEventDispatcher<{
		close: void;
	}>();
	
	$: hasError = steps.some(s => s.status === 'error');
	$: isComplete = steps.length > 0 && steps.every(s => s.status === 'success' || s.status === 'error');
	
	function handleClose() {
		dispatch('close');
	}
	
	function handleOverlayClick(e: MouseEvent) {
		// Close when clicking overlay (not the card)
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClose();
		}
	}
</script>

{#if isVisible}
	<div 
		class="export-progress-overlay"
		on:click={handleOverlayClick}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="export-progress-title"
	>
		<div class="export-progress-card" on:click|stopPropagation>
			<div class="progress-header">
				<h3 id="export-progress-title" class="progress-title">
					<span class="progress-icon">📤</span>
					<span>Đang xuất ảnh...</span>
				</h3>
				<button 
					class="progress-close"
					on:click={handleClose}
					aria-label="Đóng"
					title="Đóng (Esc)"
				>
					✕
				</button>
			</div>

			<div class="progress-steps">
				{#each steps as step, index}
					<div class="step-item" class:error={step.status === 'error'}>
						<div class="step-indicator">
							{#if step.status === 'pending'}
								<span class="step-number">{index + 1}</span>
							{:else if step.status === 'in-progress'}
								<span class="step-spinner">⏳</span>
							{:else if step.status === 'success'}
								<span class="step-check">✓</span>
							{:else if step.status === 'error'}
								<span class="step-error">✗</span>
							{/if}
						</div>
						
						<div class="step-content">
							<div class="step-name">{step.name}</div>
							{#if step.message}
								<div class="step-message">{step.message}</div>
							{/if}
							{#if step.preview}
								<div class="step-preview">
									<img src={step.preview} alt={step.name} />
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			{#if hasError}
				<div class="progress-error">
					<span class="error-icon">⚠️</span>
					<span>Có lỗi xảy ra trong quá trình xuất ảnh. Vui lòng kiểm tra console để biết thêm chi tiết.</span>
				</div>
			{/if}

			{#if isComplete && !hasError}
				<div class="progress-success">
					<span class="success-icon">✅</span>
					<span>Xuất ảnh thành công!</span>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.export-progress-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 20000;
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

	.export-progress-card {
		background: var(--color-surface-50);
		border-radius: var(--radius-cartoon);
		padding: 24px;
		max-width: 600px;
		width: 90%;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		animation: slideUp 0.3s ease;
	}

	:global(.dark) .export-progress-card {
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

	.progress-header {
		margin-bottom: 20px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.progress-title {
		font-size: 20px;
		font-weight: 600;
		color: var(--color-surface-800);
		margin: 0;
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;
	}

	.progress-close {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: var(--color-surface-200);
		border-radius: 8px;
		color: var(--color-surface-700);
		font-size: 18px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.progress-close:hover {
		background: var(--color-surface-300);
		color: var(--color-surface-900);
		transform: scale(1.1);
	}

	.progress-close:active {
		transform: scale(0.95);
	}

	:global(.dark) .progress-close {
		background: var(--color-surface-700);
		color: var(--color-surface-300);
	}

	:global(.dark) .progress-close:hover {
		background: var(--color-surface-600);
		color: var(--color-surface-100);
	}

	:global(.dark) .progress-title {
		color: var(--color-surface-100);
	}

	.progress-icon {
		font-size: 24px;
	}

	.progress-steps {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 20px;
	}

	.step-item {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 12px;
		background: var(--color-surface-100);
		border-radius: 12px;
		border: 2px solid transparent;
		transition: all 0.2s ease;
	}

	.step-item.error {
		border-color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
	}

	:global(.dark) .step-item {
		background: var(--color-surface-700);
	}

	:global(.dark) .step-item.error {
		background: rgba(239, 68, 68, 0.2);
	}

	.step-indicator {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--color-surface-200);
		font-weight: 600;
		font-size: 14px;
	}

	:global(.dark) .step-indicator {
		background: var(--color-surface-600);
	}

	.step-number {
		color: var(--color-surface-600);
	}

	:global(.dark) .step-number {
		color: var(--color-surface-300);
	}

	.step-spinner {
		font-size: 18px;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.step-check {
		color: #22c55e;
		font-size: 18px;
		font-weight: bold;
	}

	.step-error {
		color: #ef4444;
		font-size: 18px;
		font-weight: bold;
	}

	.step-content {
		flex: 1;
		min-width: 0;
	}

	.step-name {
		font-weight: 600;
		color: var(--color-surface-800);
		margin-bottom: 4px;
	}

	:global(.dark) .step-name {
		color: var(--color-surface-100);
	}

	.step-message {
		font-size: 14px;
		color: var(--color-surface-600);
		margin-top: 4px;
	}

	:global(.dark) .step-message {
		color: var(--color-surface-400);
	}

	.step-preview {
		margin-top: 8px;
		border-radius: 8px;
		overflow: hidden;
		max-width: 200px;
		border: 2px solid var(--color-surface-300);
	}

	.step-preview img {
		width: 100%;
		height: auto;
		display: block;
	}

	.progress-error {
		padding: 12px;
		background: rgba(239, 68, 68, 0.1);
		border: 2px solid #ef4444;
		border-radius: 12px;
		display: flex;
		align-items: center;
		gap: 12px;
		color: #ef4444;
		font-size: 14px;
	}

	.progress-success {
		padding: 12px;
		background: rgba(34, 197, 94, 0.1);
		border: 2px solid #22c55e;
		border-radius: 12px;
		display: flex;
		align-items: center;
		gap: 12px;
		color: #22c55e;
		font-size: 14px;
		font-weight: 600;
	}

	.error-icon,
	.success-icon {
		font-size: 20px;
	}
</style>

