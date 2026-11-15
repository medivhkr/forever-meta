import type { ReactNode } from 'react';
import { iconUrls } from '../data/specs.ts';
import { cssVars } from '../lib/helpers.ts';

interface Props {
  icon: ReactNode; // иконка слева от заголовка
  art?: string; // имя иконки из игры: её размытая копия подсвечивает шапку
  title: ReactNode;
  titleColor?: string; // цвет класса или качества предмета
  chips?: ReactNode[];
  meta?: ReactNode; // строка под чипами, например «Обновлено …»
  children?: ReactNode; // пояснение под шапкой
}

// Шапка страницы: иконка, заголовок, метки и пояснение. Фон — та же иконка, сильно размытая.
export default function PageHero({ icon, art, title, titleColor, chips, meta, children }: Props) {
  const vars: Record<string, string> = {};
  if (art) vars['--art'] = `url("${iconUrls(art)[1]}")`;
  if (titleColor) vars['--tc'] = titleColor;

  return (
    <header className="hero" style={cssVars(vars)}>
      <div className="hero__top">
        <div className="hero__icon">{icon}</div>
        <div className="hero__text">
          <h1 className={titleColor ? 'hero__title is-colored' : 'hero__title'}>{title}</h1>
          {chips && chips.length > 0 && (
            <div className="chips">
              {chips.map((chip, i) => (
                <span key={i} className="chip">
                  {chip}
                </span>
              ))}
            </div>
          )}
          {meta && <p className="hero__meta">{meta}</p>}
        </div>
      </div>
      {children && <div className="hero__lead">{children}</div>}
    </header>
  );
}
