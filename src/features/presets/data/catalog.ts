import { PRESET_ID } from '@/features/presets/constants';
import type { WheelPresetDefinition } from '@/features/presets/types';
import { clonePresetDefinition } from '@/features/presets/utils/clonePreset';
import { deepFreeze } from '@/features/presets/utils/freezePreset';
import type { WheelPresetId } from '@/types/wheel';

const PRESET_CATALOG: readonly WheelPresetDefinition[] = deepFreeze([
  {
    id: PRESET_ID.food,
    name: 'Food',
    description: 'Pick a meal, then a pizza topping.',
    category: 'Food',
    icon: '🍕',
    items: [
      {
        name: 'Pizza',
        icon: '🍕',
        children: [{ name: 'Chicken Pepperoni' }, { name: 'Beef Pepperoni' }],
      },
      { name: 'Burger', icon: '🍔' },
      { name: 'Noodles', icon: '🍜' },
      { name: 'Sushi', icon: '🍣' },
    ],
  },
  {
    id: PRESET_ID.movie,
    name: 'Movie',
    description: 'Choose a genre for movie night.',
    category: 'Decisions',
    icon: '🎬',
    items: [
      { name: 'Action' },
      { name: 'Comedy' },
      { name: 'Horror' },
      { name: 'Sci-Fi' },
    ],
  },
  {
    id: PRESET_ID.workout,
    name: 'Workout',
    description: 'Pick a session to start.',
    category: 'Decisions',
    icon: '💪',
    items: [
      { name: 'Push Ups' },
      { name: 'Squats' },
      { name: 'Running' },
      { name: 'Cycling' },
    ],
  },
  {
    id: PRESET_ID.team,
    name: 'Team',
    description: 'Example team members for standups and chores.',
    category: 'General',
    icon: '👥',
    items: [
      { name: 'Alex Rivera' },
      { name: 'Jordan Lee' },
      { name: 'Sam Okonkwo' },
      { name: 'Taylor Chen' },
    ],
  },
]);

export function listPresets(): WheelPresetDefinition[] {
  return PRESET_CATALOG.map(clonePresetDefinition);
}

export function getPreset(id: WheelPresetId): WheelPresetDefinition | undefined {
  const preset = PRESET_CATALOG.find((entry) => entry.id === id);
  return preset ? clonePresetDefinition(preset) : undefined;
}

export function getFrozenPresetCatalog(): readonly WheelPresetDefinition[] {
  return PRESET_CATALOG;
}
