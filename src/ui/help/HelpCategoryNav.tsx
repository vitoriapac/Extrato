import type { JSX } from 'preact';

export interface HelpCategoryItem {
  id: string;
  title: string;
  summary?: string;
  [key: string]: any;
}

export interface HelpCategoryNavProps {
  categories: HelpCategoryItem[];
  activeCategoryId?: string;
}

export function HelpCategoryNav({
  categories,
  activeCategoryId,
}: HelpCategoryNavProps): JSX.Element {
  return (
    <nav class="help-card-grid" aria-label="Capítulos da ajuda">
      {categories.map((category, index) => {
        const isCurrent = activeCategoryId ? category.id === activeCategoryId : index === 0;
        return (
          <div class="help-guide-card" key={category.id}>
            <button
              type="button"
              class="help-category-link"
              data-help-category={category.id}
              aria-controls={category.id}
              {...(isCurrent ? { 'aria-current': 'location' } : {})}
            >
              {category.title}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
