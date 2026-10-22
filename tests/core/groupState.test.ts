import { describe, expect, test } from 'vitest';
import { defaultOpen, groupId, stateKey } from '../../src/core/groupState';
import type { TaskGroup } from '../../src/core/query';

const group = (label: string): TaskGroup => ({ label, key: null, tasks: [] });

describe('groupId', () => {
	test('names the four kinds of group', () => {
		expect(groupId(group('Scheduled'))).toBe('own');
		expect(groupId(group('Scheduled this week'))).toBe('parent');
		expect(groupId(group('Overdue'))).toBe('overdue');
		expect(groupId(group('2026-10-22'))).toBe('child');
		expect(groupId(group('2026-W43'))).toBe('child');
	});
});

describe('stateKey', () => {
	test('is per note kind, so the choice applies to every note of that kind', () => {
		expect(stateKey('week', 'own')).toBe('week:own');
		expect(stateKey('day', 'overdue')).toBe('day:overdue');
	});
});

describe('defaultOpen', () => {
	test('scheduled and overdue groups start open, child periods and Done start closed', () => {
		expect(defaultOpen('own')).toBe(true);
		expect(defaultOpen('parent')).toBe(true);
		expect(defaultOpen('overdue')).toBe(true);
		expect(defaultOpen('child')).toBe(false);
		expect(defaultOpen('done')).toBe(false);
	});
});
