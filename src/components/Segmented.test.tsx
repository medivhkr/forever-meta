import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Segmented from './Segmented.tsx';

describe('Segmented', () => {
  it('подсвечивает выбранный вариант и сообщает о клике', async () => {
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

    // Ищем элементы так, как их видит пользователь и скринридер: по роли и подписи
    expect(screen.getByRole('group', { name: 'Роль' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Урон' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Лечение' })).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(screen.getByRole('button', { name: 'Лечение' }));
    expect(onChange).toHaveBeenCalledWith('heal');
  });
});
