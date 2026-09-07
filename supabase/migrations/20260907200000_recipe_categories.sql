-- ============================================================================
-- Curated categories for recipes.
--
-- Separate from `tags`, which is free text seeded by extraction and therefore
-- too noisy to build a filter row from. This column holds a short, fixed
-- vocabulary the UI can render as a stable set of chips.
--
-- An array rather than a single value on purpose: the vocabulary spans two
-- axes — what a dish is made of (בשרי / חלבי / דגים) and what it is for
-- (סלטים / מאפים מלוחים / קינוחים) — so a dairy dessert needs both. A recipe
-- with one entry behaves exactly like a single-category recipe.
-- ============================================================================

alter table public.recipes
  add column categories text[] not null default '{}';

create index recipes_categories_idx on public.recipes using gin (categories);
