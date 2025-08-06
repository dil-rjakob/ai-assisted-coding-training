import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { loadTodos, saveTodos, isValidTodos } from '../utils/sessionStorage';
import type { Todo } from '../types/Todo';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

// Mock window object
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('sessionStorage utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isValidTodos', () => {
    it('should return true for valid todos array', () => {
      const validTodos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date(),
        },
      ];

      expect(isValidTodos(validTodos)).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(isValidTodos([])).toBe(true);
    });

    it('should return false for non-array values', () => {
      expect(isValidTodos(null)).toBe(false);
      expect(isValidTodos(undefined)).toBe(false);
      expect(isValidTodos('string')).toBe(false);
      expect(isValidTodos(123)).toBe(false);
      expect(isValidTodos({})).toBe(false);
    });

    it('should return false for array with invalid todo objects', () => {
      const invalidTodos = [
        { id: '1', title: 'Test' }, // missing required fields
        { id: 123, title: 'Test', description: 'Desc', completed: false }, // invalid id type
        { id: '1', title: 123, description: 'Desc', completed: false }, // invalid title type
        { id: '1', title: 'Test', description: 123, completed: false }, // invalid description type
        { id: '1', title: 'Test', description: 'Desc', completed: 'false' }, // invalid completed type
      ];

      invalidTodos.forEach(invalidTodo => {
        expect(isValidTodos([invalidTodo])).toBe(false);
      });
    });

    it('should return true for todos with string createdAt', () => {
      const todosWithStringDate = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ];

      expect(isValidTodos(todosWithStringDate)).toBe(true);
    });
  });

  describe('loadTodos', () => {
    it('should return empty array when no data in storage', () => {
      (mockSessionStorage.getItem as Mock).mockReturnValue(null);

      const result = loadTodos();

      expect(result).toEqual([]);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('todos');
    });

    it('should return parsed todos from storage', () => {
      const storedTodos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date('2023-01-01'),
        },
      ];

      (mockSessionStorage.getItem as Mock).mockReturnValue(JSON.stringify(storedTodos));

      const result = loadTodos();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
        })
      );
      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('should convert string createdAt to Date objects', () => {
      const storedData = JSON.stringify([
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ]);

      (mockSessionStorage.getItem as Mock).mockReturnValue(storedData);

      const result = loadTodos();

      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].createdAt.toISOString()).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should return empty array and clear storage on invalid JSON', () => {
      (mockSessionStorage.getItem as Mock).mockReturnValue('invalid json');

      const result = loadTodos();

      expect(result).toEqual([]);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('todos');
    });

    it('should return empty array and clear storage on invalid data structure', () => {
      (mockSessionStorage.getItem as Mock).mockReturnValue(JSON.stringify([{ invalid: 'data' }]));

      const result = loadTodos();

      expect(result).toEqual([]);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('todos');
    });

    it('should handle storage access errors gracefully', () => {
      (mockSessionStorage.getItem as Mock).mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const result = loadTodos();

      expect(result).toEqual([]);
    });

    it('should return empty array when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      const result = loadTodos();

      expect(result).toEqual([]);

      global.window = originalWindow;
    });
  });

  describe('saveTodos', () => {
    it('should save todos to sessionStorage and return true', () => {
      const todos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date('2023-01-01'),
        },
      ];

      const result = saveTodos(todos);

      expect(result).toBe(true);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('todos', JSON.stringify(todos));
    });

    it('should return false on QuotaExceededError', () => {
      const todos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date(),
        },
      ];

      const quotaError = new Error('Quota exceeded');
      quotaError.name = 'QuotaExceededError';
      (mockSessionStorage.setItem as Mock).mockImplementation(() => {
        throw quotaError;
      });

      const result = saveTodos(todos);

      expect(result).toBe(false);
    });

    it('should return false on other storage errors', () => {
      const todos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date(),
        },
      ];

      (mockSessionStorage.setItem as Mock).mockImplementation(() => {
        throw new Error('Other storage error');
      });

      const result = saveTodos(todos);

      expect(result).toBe(false);
    });

    it('should return false when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      const result = saveTodos([]);

      expect(result).toBe(false);

      global.window = originalWindow;
    });

    it('should return false when sessionStorage is not available', () => {
      const originalSessionStorage = window.sessionStorage;
      // @ts-expect-error - Testing scenario where sessionStorage is not available
      delete window.sessionStorage;

      const result = saveTodos([]);

      expect(result).toBe(false);

      window.sessionStorage = originalSessionStorage;
    });
  });
});
