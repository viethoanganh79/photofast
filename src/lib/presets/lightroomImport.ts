/**
 * lightroomImport.ts
 *
 * Import Lightroom presets (.xmp, .lrtemplate) into PhotoFast FilterState.
 */

import { defaultFilterState, type FilterState } from '../canvas/filters';
import { createPresetFromState, type CustomPreset } from './customPresets';

type RawValues = Record<string, number>;

export interface ImportOptions {
	defaultEmoji?: string;
	existingNames?: Set<string>;
	description?: string;
}

const DEFAULT_DESCRIPTION = 'Imported from Lightroom';

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function normalizeKey(key: string): string {
	if (!key) return key;
	if (key.startsWith('crs:')) {
		return key.slice(4);
	}
	return key;
}

function getBaseName(fileName: string): string {
	const lastDot = fileName.lastIndexOf('.');
	if (lastDot <= 0) return fileName;
	return fileName.slice(0, lastDot);
}

function makeUniqueName(base: string, existing?: Set<string>): string {
	if (!existing) return base;
	let name = base;
	let counter = 2;
	while (existing.has(name)) {
		name = `${base} (${counter})`;
		counter += 1;
	}
	existing.add(name);
	return name;
}

function parseNumber(value: string | null | undefined): number | null {
	if (value == null) return null;
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : null;
}

export function parseXmpPreset(xml: string): RawValues {
	const raw: RawValues = {};
	const parser = new DOMParser();
	const doc = parser.parseFromString(xml, 'application/xml');
	const parserErrors = doc.getElementsByTagName('parsererror');
	if (parserErrors && parserErrors.length > 0) {
		throw new Error('Invalid XMP XML');
	}

	const allElements = Array.from(doc.getElementsByTagName('*'));
	for (const el of allElements) {
		if (!el.attributes) continue;
		for (const attr of Array.from(el.attributes)) {
			const key = normalizeKey(attr.localName || attr.name);
			const value = parseNumber(attr.value);
			if (value == null) continue;
			raw[key] = value;
		}
	}

	return raw;
}

export function parseLrtemplatePreset(text: string): RawValues {
	const raw: RawValues = {};
	const regex = /([A-Za-z0-9_]+)\s*=\s*([-+]?\d*\.?\d+)/g;
	let match: RegExpExecArray | null;
	while ((match = regex.exec(text)) !== null) {
		const key = normalizeKey(match[1]);
		const value = parseNumber(match[2]);
		if (value == null) continue;
		raw[key] = value;
	}
	return raw;
}

function mapExposure(value: number): number {
	// Lightroom -5..+5 -> PhotoFast -100..100
	return clamp(value * 20, -100, 100);
}

function mapTemperature(value: number): number {
	// Kelvin -> -100..100, normalize around 5000K
	return clamp((value - 5000) / 200, -100, 100);
}

function mapSigned(value: number): number {
	return clamp(value, -100, 100);
}

function mapUnsigned(value: number): number {
	return clamp(value, 0, 100);
}

export function mapLightroomToFilterState(raw: RawValues): FilterState {
	const state: FilterState = { ...defaultFilterState };
	let appliedCount = 0;

	const apply = (key: keyof FilterState, value: number) => {
		state[key] = value;
		appliedCount += 1;
	};

	const pick = (keys: string[]): number | null => {
		for (const key of keys) {
			if (key in raw) return raw[key];
		}
		return null;
	};

	const exposure = pick(['Exposure2012', 'Exposure']);
	if (exposure != null) apply('exposure', mapExposure(exposure));

	const contrast = pick(['Contrast2012', 'Contrast']);
	if (contrast != null) apply('contrast', mapSigned(contrast));

	const highlights = pick(['Highlights2012', 'Highlights']);
	if (highlights != null) apply('highlights', mapSigned(highlights));

	const shadows = pick(['Shadows2012', 'Shadows']);
	if (shadows != null) apply('shadows', mapSigned(shadows));

	const whites = pick(['Whites2012', 'Whites']);
	if (whites != null) apply('whites', mapSigned(whites));

	const blacks = pick(['Blacks2012', 'Blacks']);
	if (blacks != null) apply('blacks', mapSigned(blacks));

	const temperature = pick(['Temperature']);
	if (temperature != null) apply('temperature', mapTemperature(temperature));

	const tint = pick(['Tint']);
	if (tint != null) apply('tint', mapSigned(tint));

	const vibrance = pick(['Vibrance']);
	if (vibrance != null) apply('vibrance', mapSigned(vibrance));

	const saturation = pick(['Saturation']);
	if (saturation != null) apply('saturation', mapSigned(saturation));

	const clarity = pick(['Clarity2012', 'Clarity']);
	if (clarity != null) apply('clarity', mapSigned(clarity));

	const sharpness = pick(['Sharpness']);
	if (sharpness != null) apply('sharpness', mapUnsigned(sharpness));

	const grain = pick(['GrainAmount']);
	if (grain != null) apply('grain', mapUnsigned(grain));

	const vignette = pick(['PostCropVignetteAmount']);
	if (vignette != null) apply('vignette', mapSigned(vignette));

	// HSL Hue adjustments
	const hueRed = pick(['HueAdjustmentRed']);
	if (hueRed != null) apply('hueRed', mapSigned(hueRed));
	const hueOrange = pick(['HueAdjustmentOrange']);
	if (hueOrange != null) apply('hueOrange', mapSigned(hueOrange));
	const hueYellow = pick(['HueAdjustmentYellow']);
	if (hueYellow != null) apply('hueYellow', mapSigned(hueYellow));
	const hueGreen = pick(['HueAdjustmentGreen']);
	if (hueGreen != null) apply('hueGreen', mapSigned(hueGreen));
	const hueAqua = pick(['HueAdjustmentAqua', 'HueAdjustmentCyan']);
	if (hueAqua != null) apply('hueCyan', mapSigned(hueAqua));
	const hueBlue = pick(['HueAdjustmentBlue']);
	if (hueBlue != null) apply('hueBlue', mapSigned(hueBlue));
	const huePurple = pick(['HueAdjustmentPurple']);
	if (huePurple != null) apply('huePurple', mapSigned(huePurple));
	const hueMagenta = pick(['HueAdjustmentMagenta']);
	if (hueMagenta != null) apply('hueMagenta', mapSigned(hueMagenta));

	// HSL Saturation adjustments
	const satRed = pick(['SaturationAdjustmentRed']);
	if (satRed != null) apply('satRed', mapSigned(satRed));
	const satOrange = pick(['SaturationAdjustmentOrange']);
	if (satOrange != null) apply('satOrange', mapSigned(satOrange));
	const satYellow = pick(['SaturationAdjustmentYellow']);
	if (satYellow != null) apply('satYellow', mapSigned(satYellow));
	const satGreen = pick(['SaturationAdjustmentGreen']);
	if (satGreen != null) apply('satGreen', mapSigned(satGreen));
	const satAqua = pick(['SaturationAdjustmentAqua', 'SaturationAdjustmentCyan']);
	if (satAqua != null) apply('satCyan', mapSigned(satAqua));
	const satBlue = pick(['SaturationAdjustmentBlue']);
	if (satBlue != null) apply('satBlue', mapSigned(satBlue));
	const satPurple = pick(['SaturationAdjustmentPurple']);
	if (satPurple != null) apply('satPurple', mapSigned(satPurple));
	const satMagenta = pick(['SaturationAdjustmentMagenta']);
	if (satMagenta != null) apply('satMagenta', mapSigned(satMagenta));

	if (appliedCount === 0) {
		throw new Error('No supported Lightroom settings found');
	}

	return state;
}

export async function importLightroomPresetFile(
	file: File,
	options?: ImportOptions
): Promise<CustomPreset> {
	const nameBase = getBaseName(file.name);
	const uniqueName = makeUniqueName(nameBase, options?.existingNames);
	const description = options?.description ?? DEFAULT_DESCRIPTION;
	const emoji = options?.defaultEmoji ?? '📥';

	const text = await file.text();
	const extension = file.name.toLowerCase().split('.').pop();

	let raw: RawValues;
	if (extension === 'xmp') {
		raw = parseXmpPreset(text);
	} else if (extension === 'lrtemplate') {
		raw = parseLrtemplatePreset(text);
	} else {
		throw new Error('Unsupported file type');
	}

	const filters = mapLightroomToFilterState(raw);
	return createPresetFromState(uniqueName, emoji, description, filters);
}
