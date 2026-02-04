<script lang="ts">
	import { slide } from 'svelte/transition';
	
	// Props
	export let title: string;
	export let icon: string = '';
	export let isOpen: boolean = true;
	
	function toggle() {
		isOpen = !isOpen;
	}
</script>

<div class="collapsible-panel" class:is-open={isOpen}>
	<button 
		class="panel-header" 
		on:click={toggle}
		aria-expanded={isOpen}
	>
		<span class="panel-title">
			{#if icon}
				<span class="panel-icon">{icon}</span>
			{/if}
			<span>{title}</span>
		</span>
		<span class="panel-toggle" class:rotated={isOpen}>
			▼
		</span>
	</button>
	
	{#if isOpen}
		<div class="panel-content" transition:slide={{ duration: 200 }}>
			<slot />
		</div>
	{/if}
</div>

<style>
	.collapsible-panel {
		border-radius: var(--radius-cartoon);
		background: var(--color-surface-50);
		overflow: hidden;
	}
	
	:global(.dark) .collapsible-panel {
		background: var(--color-surface-700);
	}
	
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: background 150ms ease;
	}
	
	.panel-header:hover {
		background: var(--color-surface-100);
	}
	
	:global(.dark) .panel-header:hover {
		background: var(--color-surface-600);
	}
	
	.panel-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 700;
		font-size: 0.875rem;
		color: var(--color-surface-700);
	}
	
	:global(.dark) .panel-title {
		color: var(--color-surface-200);
	}
	
	.panel-icon {
		font-size: 1rem;
	}
	
	.panel-toggle {
		font-size: 0.625rem;
		color: var(--color-surface-400);
		transition: transform 200ms ease;
	}
	
	:global(.dark) .panel-toggle {
		color: var(--color-surface-500);
	}
	
	.panel-toggle.rotated {
		transform: rotate(180deg);
	}
	
	.panel-content {
		padding: 0.5rem 1rem 1rem;
	}
</style>

