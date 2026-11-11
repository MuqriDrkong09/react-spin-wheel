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
    expect(theme.palette.primary.main).toBe('#0f766e');
    expect(theme.palette.secondary.main).toBe('#334155');
    expect(theme.palette.background.default).toBe('#f4f7f7');
    expect(theme.palette.background.paper).toBe('#ffffff');
    expect(theme.palette.text.primary).toBe('#0f172a');
    expect(theme.palette.text.secondary).toBe('#475569');
    expect(theme.palette.divider).toBe('#d7e0e0');
    expect(theme.shape.borderRadius).toBe(10);
    expect(theme.typography.fontFamily).toContain('Plus Jakarta Sans');
    expect(theme.typography.h1.fontWeight).toBe(700);
    expect(theme.typography.h1.letterSpacing).toBe('-0.03em');
    expect(theme.typography.h2.fontWeight).toBe(700);
    expect(theme.typography.h2.letterSpacing).toBe('-0.025em');
    expect(theme.typography.button.textTransform).toBe('none');
    expect(theme.typography.button.fontWeight).toBe(600);
    expect(theme.components?.MuiAppBar?.defaultProps).toEqual({ elevation: 0, color: 'inherit' });
    expect(theme.components?.MuiButton?.defaultProps).toEqual({ disableElevation: true });
    expect(theme.components?.MuiPaper?.defaultProps).toEqual({ elevation: 0 });
    expect(theme.components?.MuiPaper?.styleOverrides).toMatchObject({
      root: { backgroundImage: 'none' },
    });
    expect(theme.components?.MuiCssBaseline?.styleOverrides).toMatchObject({
      html: { colorScheme: 'light' },
      body: { minHeight: '100vh' },
    });
    expect(theme.components?.MuiButton?.styleOverrides).toBeDefined();
    expect(theme.components?.MuiButtonBase?.defaultProps).toEqual({ disableRipple: true });
  });

  it('builds a dark theme with inverted surfaces and the matching color scheme', () => {
    const theme = createAppTheme('dark');

    expect(theme.palette.mode).toBe('dark');
    expect(theme.palette.primary.main).toBe('#2dd4bf');
    expect(theme.palette.secondary.main).toBe('#94a3b8');
    expect(theme.palette.background.default).toBe('#0a1214');
    expect(theme.palette.background.paper).toBe('#111a1c');
    expect(theme.palette.text.primary).toBe('#f1f5f9');
    expect(theme.palette.text.secondary).toBe('#94a3b8');
    expect(theme.palette.divider).toBe('#1f2d30');
    expect(theme.components?.MuiCssBaseline?.styleOverrides).toMatchObject({
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
    expect(theme.palette.primary.main).toBe('#0f766e');
  });
});
