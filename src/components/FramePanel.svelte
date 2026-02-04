<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import CollapsiblePanel from './CollapsiblePanel.svelte';
	import FrameCustomizer from './FrameCustomizer.svelte';
	import { 
		basicFrames, 
		decorativeFrames, 
		type FrameId, 
		type FrameConfig,
		type FrameOptions,
		DEFAULT_FRAME_OPTIONS 
	} from '$lib/frames';
	
	// Props
	export let activeFrameId: FrameId = 'none';
	export let hasImage = false;
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		select: { frameId: FrameId; options: FrameOptions };
		optionsChange: { frameId: FrameId; options: FrameOptions };
		remove: void;
	}>();
	
	// Current frame options
	let currentOptions: FrameOptions = { ...DEFAULT_FRAME_OPTIONS };
	
	// Panel states
	let panelStates = {
		basic: true,
		decorative: true,
	};
	
	// Get active frame config
	$: activeFrame = [...basicFrames, ...decorativeFrames].find(f => f.id === activeFrameId);
	
	// Update options when frame changes
	$: if (activeFrame) {
		currentOptions = { ...activeFrame.defaultOptions };
	}
	
	function handleFrameSelect(frame: FrameConfig) {
		if (activeFrameId === frame.id) {
			// Deselect if clicking same frame
			activeFrameId = 'none';
			dispatch('remove');
		} else {
			activeFrameId = frame.id;
			currentOptions = { ...frame.defaultOptions };
			dispatch('select', { 
				frameId: frame.id, 
				options: currentOptions 
			});
		}
	}
	
	function handleOptionsChange(e: CustomEvent<FrameOptions>) {
		currentOptions = e.detail;
		if (activeFrameId !== 'none') {
			dispatch('optionsChange', { 
				frameId: activeFrameId, 
				options: currentOptions 
			});
		}
	}
	
	function handleRemoveFrame() {
		activeFrameId = 'none';
		dispatch('remove');
	}
</script>

<div class="frame-panel">
	<h3 class="panel-main-title">
		<span>🖼️</span>
		<span>Khung ảnh</span>
	</h3>
	
	{#if !hasImage}
		<div class="no-image-message">
			<span class="message-icon">📷</span>
			<p>Vui lòng tải ảnh lên trước</p>
		</div>
	{:else}
		<div class="panels-container">
			<!-- Basic Frames -->
			<CollapsiblePanel 
				title="Khung cơ bản" 
				icon="▫️"
				bind:isOpen={panelStates.basic}
			>
				<div class="frames-grid">
					{#each basicFrames as frame (frame.id)}
						<button
							class="frame-thumb"
							class:active={activeFrameId === frame.id}
							on:click={() => handleFrameSelect(frame)}
							title={frame.description}
						>
							<span class="frame-icon">{frame.icon}</span>
							<span class="frame-name">{frame.name}</span>
						</button>
					{/each}
				</div>
			</CollapsiblePanel>
			
			<!-- Decorative Frames -->
			<CollapsiblePanel 
				title="Khung trang trí" 
				icon="🎨"
				bind:isOpen={panelStates.decorative}
			>
				<div class="frames-grid">
					{#each decorativeFrames as frame (frame.id)}
						<button
							class="frame-thumb"
							class:active={activeFrameId === frame.id}
							on:click={() => handleFrameSelect(frame)}
							title={frame.description}
						>
							<span class="frame-icon">{frame.icon}</span>
							<span class="frame-name">{frame.name}</span>
						</button>
					{/each}
				</div>
			</CollapsiblePanel>
			
			<!-- Customizer (show when frame is selected) -->
			{#if activeFrame && activeFrameId !== 'none'}
				<div class="customizer-section">
					<FrameCustomizer
						frameConfig={activeFrame}
						options={currentOptions}
						on:change={handleOptionsChange}
					/>
					
					<button 
						class="remove-frame-btn"
						on:click={handleRemoveFrame}
					>
						<span>🗑️</span>
						<span>Xóa khung</span>
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.frame-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.panel-main-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-surface-800);
		margin: 0;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid var(--color-surface-100);
		flex-shrink: 0;
	}
	
	:global(.dark) .panel-main-title {
		color: #ffffff;
		border-bottom-color: var(--color-surface-600);
	}
	
	.panels-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.no-image-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem 1rem;
		color: var(--color-surface-400);
		text-align: center;
	}
	
	.message-icon {
		font-size: 2rem;
		opacity: 0.5;
	}
	
	.no-image-message p {
		margin: 0;
		font-size: 0.875rem;
	}
	
	/* Frames Grid */
	.frames-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}
	
	.frame-thumb {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.5rem;
		background: var(--color-surface-50);
		border: 2px solid transparent;
		border-radius: var(--radius-cartoon);
		cursor: pointer;
		transition: all 150ms ease;
	}
	
	:global(.dark) .frame-thumb {
		background: var(--color-surface-700);
	}
	
	.frame-thumb:hover {
		background: var(--color-accent-50);
		border-color: var(--color-accent-200);
	}
	
	:global(.dark) .frame-thumb:hover {
		background: rgba(249, 115, 22, 0.15);
		border-color: var(--color-accent-400);
	}
	
	.frame-thumb.active {
		background: var(--color-accent-100);
		border-color: var(--color-accent-400);
	}
	
	:global(.dark) .frame-thumb.active {
		background: rgba(249, 115, 22, 0.25);
		border-color: var(--color-accent-500);
	}
	
	.frame-icon {
		font-size: 1.25rem;
	}
	
	.frame-name {
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--color-surface-600);
		text-align: center;
		line-height: 1.2;
	}
	
	:global(.dark) .frame-name {
		color: var(--color-surface-300);
	}
	
	.frame-thumb.active .frame-name {
		color: var(--color-accent-700);
	}
	
	:global(.dark) .frame-thumb.active .frame-name {
		color: var(--color-accent-300);
	}
	
	/* Customizer Section */
	.customizer-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px dashed var(--color-surface-200);
		margin-top: 0.25rem;
	}
	
	:global(.dark) .customizer-section {
		border-top-color: var(--color-surface-600);
	}
	
	.remove-frame-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-surface-50);
		border: 2px solid transparent;
		border-radius: var(--radius-cartoon);
		color: var(--color-surface-600);
		font-weight: 600;
		font-size: 0.8125rem;
		cursor: pointer;
		transition: all 150ms ease;
	}
	
	:global(.dark) .remove-frame-btn {
		background: var(--color-surface-700);
		color: var(--color-surface-300);
	}
	
	.remove-frame-btn:hover {
		background: #fef2f2;
		border-color: #fecaca;
		color: #dc2626;
	}
	
	:global(.dark) .remove-frame-btn:hover {
		background: rgba(220, 38, 38, 0.15);
		border-color: rgba(220, 38, 38, 0.5);
		color: #fca5a5;
	}
</style>

