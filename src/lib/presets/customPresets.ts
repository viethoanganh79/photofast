/**
 * customPresets.ts
 * 
 * Quản lý Custom Presets - Preset do user tạo và lưu trong localStorage
 */

import type { Preset } from './presets';
import type { FilterState } from '../canvas/filters';

const STORAGE_KEY = 'photofast-custom-presets';
const STORAGE_VERSION = '1.0';

/**
 * Custom Preset interface - extends Preset với metadata
 */
export interface CustomPreset extends Preset {
	createdAt: number; // Timestamp khi tạo
	updatedAt: number; // Timestamp khi update lần cuối
	isCustom: true; // Flag để phân biệt với preset mặc định
}

/**
 * Storage structure trong localStorage
 */
interface PresetsStorage {
	presets: CustomPreset[];
	version: string;
}

/**
 * Generate unique ID cho preset
 */
function generatePresetId(): string {
	return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load custom presets từ localStorage
 */
export function loadCustomPresets(): CustomPreset[] {
	try {
		if (typeof localStorage === 'undefined') {
			return [];
		}

		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return [];

		const data: PresetsStorage = JSON.parse(stored);

		// Check version và migrate nếu cần
		if (data.version !== STORAGE_VERSION) {
			// Future: Implement migration logic here
			console.warn('Preset storage version mismatch, may need migration');
		}

		return data.presets || [];
	} catch (error) {
		console.error('Failed to load custom presets:', error);
		return [];
	}
}

/**
 * Save custom preset vào localStorage
 */
export function saveCustomPreset(preset: CustomPreset): void {
	try {
		if (typeof localStorage === 'undefined') {
			console.warn('localStorage not available');
			return;
		}

		const presets = loadCustomPresets();
		const existingIndex = presets.findIndex((p) => p.id === preset.id);

		if (existingIndex >= 0) {
			// Update existing preset
			presets[existingIndex] = {
				...preset,
				updatedAt: Date.now(),
			};
		} else {
			// Add new preset
			presets.push({
				...preset,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		}

		const storage: PresetsStorage = {
			presets,
			version: STORAGE_VERSION,
		};

		localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
	} catch (error) {
		console.error('Failed to save custom preset:', error);
		throw error;
	}
}

/**
 * Delete custom preset
 */
export function deleteCustomPreset(id: string): void {
	try {
		if (typeof localStorage === 'undefined') {
			console.warn('localStorage not available');
			return;
		}

		const presets = loadCustomPresets();
		const filtered = presets.filter((p) => p.id !== id);

		const storage: PresetsStorage = {
			presets: filtered,
			version: STORAGE_VERSION,
		};

		localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
	} catch (error) {
		console.error('Failed to delete custom preset:', error);
		throw error;
	}
}

/**
 * Update custom preset
 */
export function updateCustomPreset(
	id: string,
	updates: Partial<Omit<CustomPreset, 'id' | 'createdAt' | 'isCustom'>>
): void {
	try {
		const presets = loadCustomPresets();
		const index = presets.findIndex((p) => p.id === id);

		if (index < 0) {
			throw new Error(`Preset with id ${id} not found`);
		}

		presets[index] = {
			...presets[index],
			...updates,
			updatedAt: Date.now(),
		};

		const storage: PresetsStorage = {
			presets,
			version: STORAGE_VERSION,
		};

		localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
	} catch (error) {
		console.error('Failed to update custom preset:', error);
		throw error;
	}
}

/**
 * Create preset từ current filter state
 */
export function createPresetFromState(
	name: string,
	emoji: string,
	description: string,
	filters: FilterState
): CustomPreset {
	return {
		id: generatePresetId(),
		name,
		emoji,
		description,
		filters: { ...filters }, // Deep copy để tránh mutation
		createdAt: Date.now(),
		updatedAt: Date.now(),
		isCustom: true,
	};
}

/**
 * Validate preset structure
 */
export function validatePreset(preset: any): preset is CustomPreset {
	return (
		preset &&
		typeof preset.id === 'string' &&
		typeof preset.name === 'string' &&
		typeof preset.emoji === 'string' &&
		typeof preset.filters === 'object' &&
		preset.isCustom === true &&
		typeof preset.createdAt === 'number' &&
		typeof preset.updatedAt === 'number'
	);
}

/**
 * Get all presets (default + custom)
 * Import presets từ presets.ts để merge
 */
export function getAllPresets(defaultPresets: Preset[]): Preset[] {
	const customPresets = loadCustomPresets();
	return [...defaultPresets, ...customPresets];
}

/**
 * Check if preset is custom
 */
export function isCustomPreset(preset: Preset): preset is CustomPreset {
	return 'isCustom' in preset && preset.isCustom === true;
}

/**
 * Get custom preset by ID
 */
export function getCustomPresetById(id: string): CustomPreset | undefined {
	const presets = loadCustomPresets();
	return presets.find((p) => p.id === id);
}

