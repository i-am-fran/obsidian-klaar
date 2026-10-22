import { describe, expect, test } from 'vitest';
import { DEFAULT_TAG_RULES, canMarkInProgress, defaultRole, kindOf, setStatusTag, statusColumns, cyclePriorityTag, meaningOf, priorityLevels, ruleFor, setInProgress, setPriorityTag, toggleInProgress, type TagRule } from '../../src/core/tagRules';

const IN_PROGRESS: TagRule = { tag: 'in-progress', color: '#30a46c', role: 'in-progress' };
const rules: TagRule[] = [...DEFAULT_TAG_RULES, IN_PROGRESS];
const WAITING: TagRule = { tag: 'waiting', color: '#0090ff', role: 'status' };

describe('ruleFor', () => {
	test('matches with or without #, ignoring case', () => {
		expect(ruleFor('#P1', rules)?.role).toBe('priority-high');
		expect(ruleFor('bugs', rules)?.role).toBe('label');
		expect(ruleFor('#other', rules)).toBeUndefined();
	});
});

describe('meaningOf', () => {
	test('highest priority wins; in progress from its role', () => {
		expect(meaningOf(['#p3', '#p1'], rules)).toEqual({ priority: 3, inProgress: false, status: null });
		expect(meaningOf(['#p2', '#in-progress'], rules)).toEqual({ priority: 2, inProgress: true, status: null });
		expect(meaningOf(['#bugs', '#work'], rules)).toEqual({ priority: 0, inProgress: false, status: null });
	});
	test('a status tag names its column, in lower case', () => {
		expect(meaningOf(['#Waiting'], [...rules, WAITING])).toEqual({ priority: 0, inProgress: false, status: 'waiting' });
	});
	test('with two status tags, the one listed first in settings wins', () => {
		expect(meaningOf(['#in-progress', '#waiting'], [WAITING, ...rules])).toEqual({ priority: 0, inProgress: false, status: 'waiting' });
		expect(meaningOf(['#waiting', '#in-progress'], [...rules, WAITING])).toEqual({ priority: 0, inProgress: true, status: null });
	});
});

describe('tag kinds', () => {
	test('kindOf groups roles', () => {
		expect(kindOf('label')).toBe('label');
		expect(kindOf('priority-low')).toBe('priority');
		expect(kindOf('in-progress')).toBe('status');
		expect(kindOf('status')).toBe('status');
	});
	test('defaultRole picks the first option', () => {
		expect(defaultRole('label')).toBe('label');
		expect(defaultRole('priority')).toBe('priority-high');
		expect(defaultRole('status')).toBe('status');
	});
});

describe('statusColumns', () => {
	test('own-column status rules in settings order, skipping blanks and repeats', () => {
		const blocked: TagRule = { tag: 'blocked', color: '#000000', role: 'status' };
		const list = [blocked, ...rules, WAITING, { ...WAITING, tag: 'WAITING' }, { ...WAITING, tag: '' }];
		expect(statusColumns(list).map((r) => r.tag)).toEqual(['blocked', 'waiting']);
	});
});

describe('setStatusTag', () => {
	const withStatus = [...rules, WAITING, { tag: 'blocked', color: '#000000', role: 'status' } as TagRule];
	test('swaps one status tag for another', () => expect(setStatusTag('- [ ] A #blocked >[[2026-10-23]]', 'waiting', withStatus)).toBe('- [ ] A #waiting >[[2026-10-23]]'));
	test('null clears them', () => expect(setStatusTag('- [ ] A #waiting #bugs', null, withStatus)).toBe('- [ ] A #bugs'));
	test('keeps a tag already there', () => expect(setStatusTag('- [ ] A #Waiting', 'waiting', withStatus)).toBe('- [ ] A #Waiting'));
});

describe('setInProgress with a status tag', () => {
	const withStatus = [...rules, WAITING];
	test('drops the status tag', () => {
		expect(setInProgress('- [ ] A #waiting', true, withStatus, false)).toBe('- [ ] A #in-progress');
		expect(setInProgress('- [ ] A #waiting', true, withStatus, true)).toBe('- [/] A');
	});
	test('[/] with a status tag is not in progress, so marking it is not a no-op', () => {
		expect(setInProgress('- [/] A #waiting', true, withStatus, true)).toBe('- [/] A');
	});
});

describe('cyclePriorityTag', () => {
	test('none -> #p3 -> #p2 -> #p1 -> none', () => {
		const low = cyclePriorityTag('- [ ] Ship it', rules);
		expect(low).toBe('- [ ] Ship it #p3');
		const medium = cyclePriorityTag(low, rules);
		expect(medium).toBe('- [ ] Ship it #p2');
		const high = cyclePriorityTag(medium, rules);
		expect(high).toBe('- [ ] Ship it #p1');
		expect(cyclePriorityTag(high, rules)).toBe('- [ ] Ship it');
	});
	test('keeps other tags, schedule and stamp', () => {
		expect(cyclePriorityTag('- [ ] Fix #bugs >[[2026-10-23]]', rules)).toBe('- [ ] Fix #bugs #p3 >[[2026-10-23]]');
	});
	test('several priority tags: steps from the highest and leaves one', () => {
		expect(cyclePriorityTag('- [ ] A #p3 #p2', rules)).toBe('- [ ] A #p1');
	});
	test('no priority rules: unchanged', () => {
		expect(cyclePriorityTag('- [ ] A', [])).toBe('- [ ] A');
	});
});

describe('DEFAULT_TAG_RULES', () => {
	test('no in-progress tag: [/] covers that', () => {
		expect(DEFAULT_TAG_RULES.some((r) => r.role === 'in-progress')).toBe(false);
	});
});

describe('toggleInProgress with the [/] marker', () => {
	test('switches [ ] and [/]', () => {
		expect(toggleInProgress('- [ ] A #p1', rules, true)).toBe('- [/] A #p1');
		expect(toggleInProgress('- [/] A #p1', rules, true)).toBe('- [ ] A #p1');
	});
	test('a tagged task counts as in progress, and turning off clears the tag', () => {
		expect(toggleInProgress('- [ ] A #in-progress', rules, true)).toBe('- [ ] A');
	});
	test('works without any in-progress rule', () => {
		expect(toggleInProgress('- [ ] A', DEFAULT_TAG_RULES, true)).toBe('- [/] A');
	});
	test('turns [>] and [<] into [/]', () => {
		expect(toggleInProgress('- [>] A', rules, true)).toBe('- [/] A');
		expect(toggleInProgress('- [<] A', rules, true)).toBe('- [/] A');
	});
	test('a tagged someday task is not in progress', () => {
		expect(toggleInProgress('- [<] A #in-progress', rules, false)).toBe('- [ ] A #in-progress');
	});
});

describe('toggleInProgress with a tag', () => {
	test('adds and removes the in-progress tag', () => {
		expect(toggleInProgress('- [ ] A #p1', rules, false)).toBe('- [ ] A #p1 #in-progress');
		expect(toggleInProgress('- [ ] A #In-Progress #p1', rules, false)).toBe('- [ ] A #p1');
	});
	test('[/] is just open, so it gets the tag', () => {
		expect(toggleInProgress('- [/] A', rules, false)).toBe('- [/] A #in-progress');
	});
	test('no in-progress rule or not a task: unchanged', () => {
		expect(toggleInProgress('- [ ] A', [], false)).toBe('- [ ] A');
		expect(toggleInProgress('Just text', rules, false)).toBe('Just text');
	});
});

describe('toggleInProgress on a done or cancelled task', () => {
	test('reopens it as in progress, in either mode', () => {
		expect(toggleInProgress('- [x] A (@done [[2026-10-01]])', rules, true)).toBe('- [/] A');
		expect(toggleInProgress('- [-] A', rules, true)).toBe('- [/] A');
		expect(toggleInProgress('- [x] A (@done [[2026-10-01]])', rules, false)).toBe('- [ ] A #in-progress');
		expect(toggleInProgress('- [x] A #in-progress', rules, false)).toBe('- [ ] A #in-progress');
	});
	test('tag mode without a rule leaves a done task alone', () => {
		expect(toggleInProgress('- [x] A', DEFAULT_TAG_RULES, false)).toBe('- [x] A');
	});
});

describe('canMarkInProgress', () => {
	test('the [/] marker or an in-progress tag rule', () => {
		expect(canMarkInProgress(DEFAULT_TAG_RULES, true)).toBe(true);
		expect(canMarkInProgress(rules, false)).toBe(true);
		expect(canMarkInProgress(DEFAULT_TAG_RULES, false)).toBe(false);
	});
});

describe('setInProgress off', () => {
	test('clears both the marker and the tag', () => {
		expect(setInProgress('- [/] A #in-progress', false, rules, true)).toBe('- [ ] A');
		expect(setInProgress('- [/] A #in-progress', false, rules, false)).toBe('- [ ] A');
	});
});

describe('setPriorityTag, second tag at a level', () => {
	const rules = [...DEFAULT_TAG_RULES, { tag: 'urgent', color: '#e5484d', role: 'priority-high' as const }];
	test('a task already at the level through another tag is left as written', () => {
		expect(setPriorityTag('- [ ] A #urgent more', 3, rules)).toBe('- [ ] A #urgent more');
	});
});

describe('setPriorityTag', () => {
	test('leaves a line unchanged when its only priority tag is already the target', () => {
		expect(setPriorityTag('- [ ] A #p2 more', 2, DEFAULT_TAG_RULES)).toBe('- [ ] A #p2 more');
	});
	test('still cleans up a second priority tag', () => {
		expect(setPriorityTag('- [ ] A #p2 #p3 more', 2, rules)).toBe('- [ ] A more #p2');
	});
	test('level 0 on a line without priority tags is unchanged', () => {
		expect(setPriorityTag('- [ ] A #x more', 0, rules)).toBe('- [ ] A #x more');
	});
	test('replaces existing priority tags with the level', () => {
		expect(setPriorityTag('- [ ] Fix #p1 #p3', 2, rules)).toBe('- [ ] Fix #p2');
	});
	test('level 0 clears priority tags', () => {
		expect(setPriorityTag('- [ ] Fix #p2 >[[2026-10-20]]', 0, rules)).toBe('- [ ] Fix >[[2026-10-20]]');
	});
	test('no rule for the level: unchanged', () => {
		expect(setPriorityTag('- [ ] Fix', 3, rules.filter((r) => r.role !== 'priority-high'))).toBe('- [ ] Fix');
	});
});

describe('setInProgress with a tag', () => {
	test('on adds the tag once', () => {
		const on = setInProgress('- [ ] Fix', true, rules, false);
		expect(on).toBe('- [ ] Fix #in-progress');
		expect(setInProgress(on, true, rules, false)).toBe(on);
	});
	test('off removes the tag', () => {
		expect(setInProgress('- [ ] Fix #in-progress', false, rules, false)).toBe('- [ ] Fix');
	});
});

describe('priorityLevels', () => {
	test('lists levels that have a rule, high first', () => {
		expect(priorityLevels(rules)).toEqual([3, 2, 1]);
		expect(priorityLevels(rules.filter((r) => r.tag !== 'p2'))).toEqual([3, 1]);
	});
});
