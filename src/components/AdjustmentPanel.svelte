<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import SliderControl from './SliderControl.svelte';
	import CollapsiblePanel from './CollapsiblePanel.svelte';
	import { filterGroups, type FilterState } from '$lib/canvas/filters';
	
	// Props
	export let filters: FilterState;
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
		change: FilterState;
	}>();
	
	// Panel open states
	let panelStates: Record<string, boolean> = {
		light: true,
		color: true,
		hslHue: false,    // HSL Hue collapsed by default
		hslSat: false,    // HSL Saturation collapsed by default
		effects: false,   // Effects collapsed by default
	};
	
	// Color mappings for different groups
	const groupColors: Record<string, 'primary' | 'secondary' | 'accent' | 'pink'> = {
		light: 'primary',
		color: 'secondary',
		hslHue: 'pink',
		hslSat: 'accent',
		effects: 'primary',
	};
	
	// Reactive filter values - creates dependency when filters prop changes
	$: filterRecord = filters as unknown as Record<string, number>;
	
	function handleSliderChange(key: string, value: number) {
		// Dispatch new filter state without mutating prop
		const newFilters = { ...filters, [key]: value };
		dispatch('change', newFilters);
	}
</script>

<div class="adjustment-panel">
	<h3 class="panel-main-title">
		<span>🎚️</span>
		<span>Điều chỉnh</span>
	</h3>
	
	<div class="panels-container">
		{#each filterGroups as group (group.id)}
			<CollapsiblePanel 
				title={group.name} 
				icon={group.icon}
				bind:isOpen={panelStates[group.id]}
			>
				<div class="sliders-list">
					{#each group.filters as filter (filter.key)}
						<SliderControl
							label={filter.label}
							icon={filter.icon}
							color={groupColors[group.id]}
							min={filter.min}
							max={filter.max}
							unit={filter.unit || ''}
							value={filterRecord[filter.key] ?? 0}
							on:change={(e) => handleSliderChange(filter.key, e.detail)}
						/>
					{/each}
				</div>
			</CollapsiblePanel>
		{/each}
	</div>
</div>

<style>
	.adjustment-panel {
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
	
	.sliders-list {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}
</style>
