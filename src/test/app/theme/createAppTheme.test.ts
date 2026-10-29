import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAppTheme } from '@/app/theme/createAppTheme';

describe('createAppTheme', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('builds a light theme with readable contrast and shared chrome defaults', () => {
    const theme = createAppTheme('light');

    expect(theme.palette.mode).toBe('light');
    expect(theme.palette.contrastThreshold).toBe(4.5);
    expect(theme.palette.primary.main).toBe('#4338ca');
    expect(theme.palette.secondary.main).toBe('#0f766e');
    expect(theme.palette.background.default).toBe('#f8fafc');
    expect(theme.palette.background.paper).toBe('#ffffff');
    expect(theme.palette.text.primary).toBe('#0f172a');
    expect(theme.palette.text.secondary).toBe('#334155');
    expect(theme.palette.divider).toBe('#cbd5e1');
    expect(theme.shape.borderRadius).toBe(12);
    expect(theme.typography.fontFamily).toContain('Inter');
    expect(theme.typography.h1.fontWeight).toBe(700);
    expect(theme.typography.h1.letterSpacing).toBe('-0.03em');
    expect(theme.typography.h2.fontWeight).toBe(650);
    expect(theme.typography.h2.letterSpacing).toBe('-0.02em');
    expect(theme.typography.button.textTransform).toBe('none');
    expect(theme.typography.button.fontWeight).toBe(600);
    expect(theme.components?.MuiAppBar?.defaultProps).toEqual({ elevation: 0, color: 'inherit' });
    expect(theme.components?.MuiButton?.defaultProps).toEqual({ disableElevation: true });
    expect(theme.components?.MuiPaper?.defaultProps).toEqual({ elevation: 0 });
    expect(theme.components?.MuiPaper?.styleOverrides).toEqual({
      root: { backgroundImage: 'none' },
    });
    expect(theme.components?.MuiCssBaseline?.styleOverrides).toEqual({
      html: { colorScheme: 'light' },
      body: { minHeight: '100vh' },
    });
    expect(theme.components?.MuiButtonBase?.defaultProps).toEqual({ disableRipple: true });
  });

  it('builds a dark theme with inverted surfaces and the matching color scheme', () => {
    const theme = createAppTheme('dark');

    expect(theme.palette.mode).toBe('dark');
    expect(theme.palette.primary.main).toBe('#818cf8');
    expect(theme.palette.secondary.main).toBe('#5eead4');
    expect(theme.palette.background.default).toBe('#0b1220');
    expect(theme.palette.background.paper).toBe('#111827');
    expect(theme.palette.text.primary).toBe('#f8fafc');
    expect(theme.palette.text.secondary).toBe('#cbd5e1');
    expect(theme.palette.divider).toBe('#475569');
    expect(theme.components?.MuiCssBaseline?.styleOverrides).toEqual({
      html: { colorScheme: 'dark' },
      body: { minHeight: '100vh' },
    });
  });

  it('does not disable ripples outside the test runtime', async () => {
    vi.resetModules();
    vi.stubEnv('MODE', 'production');

    const { createAppTheme: createProductionTheme } = await import('@/app/theme/createAppTheme');
    const theme = createProductionTheme('light');

    expect(theme.components?.MuiButtonBase).toBeUndefined();
    expect(theme.palette.primary.main).toBe('#4338ca');
  });
});
