import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Segmented from './Segmented.tsx';

describe('Segmented', () => {
  it('отмечает выбранный вариант и сообщает о клике', async () => {
    const onChange = vi.fn();
    render(
      <Segmented
        label="Роль"
        value="dps"
        options={[
          { value: 'dps', label: 'Урон' },
          { value: 'heal', label: 'Лечение' },
        ]}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('radiogroup', { name: 'Роль' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Урон' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Лечение' })).not.toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'Лечение' }));
    expect(onChange).toHaveBeenCalledWith('heal');
  });
});
