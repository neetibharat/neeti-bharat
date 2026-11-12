import { describe, expect, it } from 'vitest';
import { matchingAnswers, restOfVariable } from './variable-items';

const ANSWERS = [
  { key: 'dpoName', label: 'DPO name' },
  { key: 'dpoEmail', label: 'DPO email' },
  { key: 'breachReportWindow', label: 'Breach report window' },
];

describe('matchingAnswers', () => {
  it('offers every answer when nothing is typed yet', () => {
    expect(matchingAnswers(ANSWERS, '')).toHaveLength(3);
  });

  it('matches the name shown, whatever the case', () => {
    expect(matchingAnswers(ANSWERS, 'BREACH').map((a) => a.key)).toEqual(['breachReportWindow']);
  });

  it('matches the key too, so what was typed from memory still finds it', () => {
    expect(matchingAnswers(ANSWERS, 'dpoem').map((a) => a.key)).toEqual(['dpoEmail']);
  });

  it('offers nothing once the braces are closed', () => {
    expect(matchingAnswers(ANSWERS, 'dpoName}}')).toEqual([]);
    expect(matchingAnswers(ANSWERS, 'dpoName}')).toEqual([]);
  });

  it('offers nothing when nothing matches, which closes the list', () => {
    expect(matchingAnswers(ANSWERS, 'zzz')).toEqual([]);
  });
});

describe('restOfVariable', () => {
  it('takes the rest of the name and the closing braces', () => {
    expect(restOfVariable('ceEmail}} and more')).toBe('ceEmail}}'.length);
    expect(restOfVariable('}}.')).toBe(2);
  });

  it('takes a custom answer’s name, which has a colon and hyphens', () => {
    expect(restOfVariable('e-address}} at')).toBe('e-address}}'.length);
  });

  it('takes nothing when the braces are not closed', () => {
    expect(restOfVariable('hello world')).toBe(0);
    expect(restOfVariable('{{dpoName}}')).toBe(0);
    expect(restOfVariable('')).toBe(0);
  });
});
