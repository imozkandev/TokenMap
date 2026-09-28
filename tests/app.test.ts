import { describe, it, expect } from 'vitest';
import { i18n } from '../src/i18n';

describe('App Setup', () => {
  it('should have correct i18n title', () => {
    expect(i18n.appTitle).toBe('Token Haritası');
  });
});
