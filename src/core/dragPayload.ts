import type { TaskRef } from './tasks';

/** MIME type for a task dragged between Klaar views. */
export const TASK_DRAG_MIME = 'application/x-klaar-task';

export interface DragPayload {
	path: string;
	line: number;
	raw: string;
}

export function encodeDragPayload(ref: Pick<TaskRef, 'path' | 'line' | 'raw'>): string {
	return JSON.stringify({ path: ref.path, line: ref.line, raw: ref.raw });
}

/** Returns null for anything that isn't a well-formed payload. */
export function parseDragPayload(s: string): DragPayload | null {
	try {
		const v: unknown = JSON.parse(s);
		if (typeof v !== 'object' || v === null) return null;
		const { path, line, raw } = v as Record<string, unknown>;
		if (typeof path !== 'string' || typeof line !== 'number' || typeof raw !== 'string') return null;
		return { path, line, raw };
	} catch {
		return null;
	}
}
