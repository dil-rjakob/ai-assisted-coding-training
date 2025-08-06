import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { TodoProvider } from '../contexts/TodoContext';
import { ToastProvider } from '../contexts/ToastContext';
import { useTodo } from '../hooks/useTodo';
import * as sessionStorageUtils from '../utils/sessionStorage';
import type { Todo } from '../types/Todo';

// Mock the sessionStorage utilities
vi.mock('../utils/sessionStorage');

const mockLoadTodos = sessionStorageUtils.loadTodos as Mock;
const mockSaveTodos = sessionStorageUtils.saveTodos as Mock;

// Test component that uses the TodoContext
const TestComponent: React.FC = () => {
  const { todos, addTodo, toggleTodoCompletion, deleteTodo } = useTodo();

  return (
    <div>
      <div data-testid="todos-count">{todos.length}</div>
      <div data-testid="todos-list">
        {todos.map(todo => (
          <div key={todo.id} data-testid={`todo-${todo.id}`}>
            {todo.title} - {todo.completed ? 'completed' : 'pending'}
          </div>
        ))}
      </div>
      <button data-testid="add-todo" onClick={() => addTodo('Test Todo', 'Test Description')}>
        Add Todo
      </button>
      <button
        data-testid="toggle-todo"
        onClick={() => todos.length > 0 && toggleTodoCompletion(todos[0].id)}
      >
        Toggle First Todo
      </button>
      <button data-testid="delete-todo" onClick={() => todos.length > 0 && deleteTodo(todos[0].id)}>
        Delete First Todo
      </button>
    </div>
  );
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ToastProvider>
      <TodoProvider>{component}</TodoProvider>
    </ToastProvider>
  );
};

describe('TodoContext with Session Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveTodos.mockReturnValue(true); // Default to successful saves
  });

  it('should initialize with empty todos when storage is empty', () => {
    mockLoadTodos.mockReturnValue([]);

    renderWithProviders(<TestComponent />);

    expect(screen.getByTestId('todos-count')).toHaveTextContent('0');
    expect(mockLoadTodos).toHaveBeenCalledOnce();
  });

  it('should initialize with todos from storage', () => {
    const existingTodos: Todo[] = [
      {
        id: '1',
        title: 'Existing Todo',
        description: 'From storage',
        completed: false,
        createdAt: new Date(),
      },
    ];
    mockLoadTodos.mockReturnValue(existingTodos);

    renderWithProviders(<TestComponent />);

    expect(screen.getByTestId('todos-count')).toHaveTextContent('1');
    expect(screen.getByTestId('todo-1')).toHaveTextContent('Existing Todo - pending');
  });

  it('should save todos to storage when adding a new todo', async () => {
    mockLoadTodos.mockReturnValue([]);

    renderWithProviders(<TestComponent />);

    fireEvent.click(screen.getByTestId('add-todo'));

    await waitFor(() => {
      expect(screen.getByTestId('todos-count')).toHaveTextContent('1');
    });

    expect(mockSaveTodos).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
        }),
      ])
    );
  });

  it('should save todos to storage when toggling completion', async () => {
    const existingTodos: Todo[] = [
      {
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date(),
      },
    ];
    mockLoadTodos.mockReturnValue(existingTodos);

    renderWithProviders(<TestComponent />);

    fireEvent.click(screen.getByTestId('toggle-todo'));

    await waitFor(() => {
      expect(screen.getByTestId('todo-1')).toHaveTextContent('Test Todo - completed');
    });

    expect(mockSaveTodos).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: '1',
          completed: true,
        }),
      ])
    );
  });

  it('should save todos to storage when deleting a todo', async () => {
    const existingTodos: Todo[] = [
      {
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date(),
      },
    ];
    mockLoadTodos.mockReturnValue(existingTodos);

    renderWithProviders(<TestComponent />);

    expect(screen.getByTestId('todos-count')).toHaveTextContent('1');

    fireEvent.click(screen.getByTestId('delete-todo'));

    await waitFor(() => {
      expect(screen.getByTestId('todos-count')).toHaveTextContent('0');
    });

    expect(mockSaveTodos).toHaveBeenCalledWith([]);
  });

  it('should show toast when storage quota is exceeded', async () => {
    mockLoadTodos.mockReturnValue([]);
    mockSaveTodos.mockReturnValue(false); // Simulate quota exceeded

    renderWithProviders(<TestComponent />);

    fireEvent.click(screen.getByTestId('add-todo'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Storage quota exceeded – your latest changes may not be saved.'
    );
  });

  it('should continue working with in-memory state when storage fails', async () => {
    mockLoadTodos.mockReturnValue([]);
    mockSaveTodos.mockReturnValue(false);

    renderWithProviders(<TestComponent />);

    // Add a todo despite storage failure
    fireEvent.click(screen.getByTestId('add-todo'));

    await waitFor(() => {
      expect(screen.getByTestId('todos-count')).toHaveTextContent('1');
    });

    // App should continue to work normally
    fireEvent.click(screen.getByTestId('toggle-todo'));

    await waitFor(() => {
      expect(screen.getByTestId('todos-list')).toHaveTextContent('completed');
    });
  });
});
