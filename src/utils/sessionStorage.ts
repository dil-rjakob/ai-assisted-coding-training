import type { Todo } from '../types/Todo';

const STORAGE_KEY = 'todos';

/**
 * Validates that the given value is an array of valid Todo objects
 */
export const isValidTodos = (value: unknown): value is Todo[] => {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((item: unknown) => {
    if (typeof item !== 'object' || item === null) {
      return false;
    }

    const todo = item as Record<string, unknown>;

    return (
      typeof todo.id === 'string' &&
      typeof todo.title === 'string' &&
      typeof todo.description === 'string' &&
      typeof todo.completed === 'boolean' &&
      (todo.createdAt instanceof Date || typeof todo.createdAt === 'string')
    );
  });
};

/**
 * Loads todos from sessionStorage with error handling
 * Returns empty array if storage is empty, corrupted, or unavailable
 */
export const loadTodos = (): Todo[] => {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return [];
    }

    const storedData = window.sessionStorage.getItem(STORAGE_KEY);
    if (!storedData) {
      return [];
    }

    const parsed = JSON.parse(storedData);

    if (!isValidTodos(parsed)) {
      console.warn('Invalid todos data in sessionStorage, clearing storage');
      window.sessionStorage.removeItem(STORAGE_KEY);
      return [];
    }

    // Convert createdAt strings back to Date objects
    return parsed.map(todo => ({
      ...todo,
      createdAt: typeof todo.createdAt === 'string' ? new Date(todo.createdAt) : todo.createdAt,
    }));
  } catch (error) {
    console.warn('Failed to load todos from sessionStorage:', error);
    // Clear corrupted data
    try {
      window.sessionStorage?.removeItem(STORAGE_KEY);
    } catch {
      // Ignore errors when clearing storage
    }
    return [];
  }
};

/**
 * Saves todos to sessionStorage with error handling
 * Returns true if successful, false if failed (e.g., quota exceeded)
 */
export const saveTodos = (todos: Todo[]): boolean => {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return false;
    }

    const dataToStore = JSON.stringify(todos);
    window.sessionStorage.setItem(STORAGE_KEY, dataToStore);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded - your latest changes may not be saved');
      return false;
    }
    console.warn('Failed to save todos to sessionStorage:', error);
    return false;
  }
};
