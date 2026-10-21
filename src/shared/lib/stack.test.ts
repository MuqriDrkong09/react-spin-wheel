import * as charts from './charts';
import * as dnd from './dnd';

describe('shared libraries', () => {
  it('exposes chart primitives', () => {
    expect(charts.ResponsiveContainer).toBeDefined();
    expect(charts.LineChart).toBeDefined();
    expect(charts.BarChart).toBeDefined();
  });

  it('exposes drag and drop primitives', () => {
    expect(dnd.DndContext).toBeDefined();
    expect(dnd.SortableContext).toBeDefined();
    expect(dnd.arrayMove).toBeTypeOf('function');
  });
});
