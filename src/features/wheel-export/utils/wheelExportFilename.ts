import { WHEEL_EXPORT_EXTENSION } from '@/features/wheel-export/constants';

const MAX_SLUG_LENGTH = 60;

export function toWheelExportFilename(name: string): string {
  const slug = slugify(name);
  const base = slug.length === 0 ? 'wheel' : endsWithWheel(slug) ? slug : `${slug}-wheel`;
  return `${base}${WHEEL_EXPORT_EXTENSION}`;
}

function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');
}

function endsWithWheel(slug: string): boolean {
  return slug === 'wheel' || slug.endsWith('-wheel');
}
