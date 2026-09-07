import type { ExtractedRecipe, Ingredient, Recipe, RecipeSource } from '@/lib/types'

/**
 * The editable shape behind the recipe form: every field is a string, because
 * that is what an <input> holds. Converted back to typed columns on save.
 *
 * This lives outside recipe-form.tsx on purpose. That file is a client module,
 * and a Server Component importing a plain function from a client module gets
 * a client reference rather than the function — calling it throws at request
 * time. The edit page is a Server Component and needs draftFromRecipe, so the
 * conversion helpers belong in a module with no boundary of its own.
 */
export type RecipeDraft = {
  title: string
  description: string
  image_url: string | null
  source_url: string | null
  source_type: RecipeSource
  source_name: string | null
  servings: string
  prep_minutes: string
  cook_minutes: string
  ingredients: Ingredient[]
  instructions: string[]
  categories: string[]
  tags: string[]
  notes: string
  is_private: boolean
  group_id: string | null
}

export const blankIngredient = (): Ingredient => ({
  quantity: null,
  unit: null,
  item: '',
  note: null,
})

export const EMPTY_DRAFT: RecipeDraft = {
  title: '',
  description: '',
  image_url: null,
  source_url: null,
  source_type: 'manual',
  source_name: null,
  servings: '',
  prep_minutes: '',
  cook_minutes: '',
  ingredients: [blankIngredient()],
  instructions: [''],
  categories: [],
  tags: [],
  notes: '',
  is_private: true,
  group_id: null,
}

export function draftFromExtraction(extracted: ExtractedRecipe): RecipeDraft {
  return {
    ...EMPTY_DRAFT,
    title: extracted.title,
    description: extracted.description ?? '',
    image_url: extracted.image_url,
    source_url: extracted.source_url,
    source_type: extracted.source_type,
    source_name: extracted.source_name,
    servings: extracted.servings ?? '',
    prep_minutes: extracted.prep_minutes ? String(extracted.prep_minutes) : '',
    cook_minutes: extracted.cook_minutes ? String(extracted.cook_minutes) : '',
    ingredients: extracted.ingredients.length ? extracted.ingredients : [blankIngredient()],
    instructions: extracted.instructions.length ? extracted.instructions : [''],
    categories: extracted.categories ?? [],
    tags: extracted.tags,
  }
}

export function draftFromRecipe(recipe: Recipe): RecipeDraft {
  return {
    title: recipe.title,
    description: recipe.description ?? '',
    image_url: recipe.image_url,
    source_url: recipe.source_url,
    source_type: recipe.source_type,
    source_name: recipe.source_name,
    servings: recipe.servings ?? '',
    prep_minutes: recipe.prep_minutes ? String(recipe.prep_minutes) : '',
    cook_minutes: recipe.cook_minutes ? String(recipe.cook_minutes) : '',
    ingredients: recipe.ingredients?.length ? recipe.ingredients : [blankIngredient()],
    instructions: recipe.instructions?.length ? recipe.instructions : [''],
    categories: recipe.categories ?? [],
    tags: recipe.tags ?? [],
    notes: recipe.notes ?? '',
    is_private: recipe.is_private,
    group_id: recipe.group_id,
  }
}
