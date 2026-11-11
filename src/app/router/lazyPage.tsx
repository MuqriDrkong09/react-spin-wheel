import { lazy, type ComponentType } from 'react';

export function lazyPage<Module extends Record<string, ComponentType>>(
  loader: () => Promise<Module>,
  exportName: keyof Module & string,
) {
  return lazy(async () => {
    const pageModule = await loader();
    return { default: pageModule[exportName] };
  });
}
