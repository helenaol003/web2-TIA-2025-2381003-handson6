import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import axios from "axios";

// Define Todo Type
interface Todo {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
}

// Fetch all todos
const fetchTodos = async (): Promise<Todo[]> => {
  const res = await axios.get("https://dummyjson.com/todos");
  return res.data.todos;
};

// Create a new todo
const createTodo = async (newTodo: Omit<Todo, "id">): Promise<Todo> => {
  const res = await axios.post("https://dummyjson.com/todos/add", newTodo);
  return res.data;
};

// Update an existing todo
const updateTodo = async ({ id, todo, completed }: Todo): Promise<Todo> => {
  const res = await axios.put(`https://dummyjson.com/todos/${id}`, {
    todo,
    completed,
  });

  return { id, todo: res.data.todo, completed: res.data.completed, userId: res.data.userId };
};

// Delete a todo
const deleteTodo = async (id: number): Promise<void> => {
  await axios.delete(`https://dummyjson.com/todos/${id}`);
};

const Todos = () => {
  const queryClient = useQueryClient();
  const [newTodo, setNewTodo] = useState<Omit<Todo, "id">>({
    todo: "",
    completed: false,
    userId: 1,
  });
  const [editTodo, setEditTodo] = useState<Todo | null>(null);

  // Fetch Todos
  const { data: todos, isLoading } = useQuery<Todo[]>({
    queryKey: ["todos"],
    queryFn: fetchTodos,
  });

  // Create Todo Mutation
  const createMutation = useMutation({
    mutationFn: createTodo,
    onSuccess: (data) => {
      // Update the cache with the new todo from the API
      queryClient.setQueryData<Todo[]>(["todos"], (oldTodos = []) => [
        data,
        ...oldTodos,
      ]);
      // Reset form
      setNewTodo({ todo: "", completed: false, userId: 1 });
    },
    onError: (error) => {
      console.error("Failed to add todo:", error);
    },
  });

  // Update Todo Mutation
  const updateMutation = useMutation({
    mutationFn: updateTodo,
    onSuccess: (updatedTodo) => {
      queryClient.setQueryData<Todo[]>(["todos"], (oldTodos) =>
        oldTodos?.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo)) || []
      );
      setEditTodo(null); // ✅ Close the modal properly
    },
    onError: (error) => {
      console.error("Failed to update todo:", error);
    },
  });

  // Delete Todo Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<Todo[]>(["todos"], (oldTodos) =>
        oldTodos?.filter((todo) => todo.id !== deletedId)
      );
    },
  });

  // Toggle Todo Completion
  const toggleTodoCompletion = (todo: Todo) => {
    updateMutation.mutate({ ...todo, completed: !todo.completed });
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.todo.trim()) {
      createMutation.mutate(newTodo);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Todos</h1>

      {/* Create Todo Form */}
      <form
        onSubmit={handleAddTodo}
        className="flex flex-col gap-4 mb-6 bg-white p-6 shadow-md rounded-lg"
      >
        <input
          type="text"
          placeholder="Add a new todo..."
          value={newTodo.todo}
          onChange={(e) => setNewTodo({ ...newTodo, todo: e.target.value })}
          className="border p-3 rounded-lg"
        />
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all disabled:bg-blue-300"
        >
          {createMutation.isPending ? "Adding..." : "Add Todo"}
        </button>
      </form>

      {/* List of Todos */}
      {isLoading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {todos?.map((todo) => (
            <div key={todo.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodoCompletion(todo)}
                  className="w-5 h-5"
                />
                <p className={`text-gray-600 ${todo.completed ? "line-through" : ""}`}>
                  {todo.todo}
                </p>
              </div>
              
              <div className="text-sm text-gray-500 mb-4">
                User ID: {todo.userId}
              </div>

              <div className="flex mt-4 gap-2">
                <button
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-all"
                  onClick={() => setEditTodo(todo)}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all"
                  onClick={() => deleteMutation.mutate(todo.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Todo Modal */}
      {editTodo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4">Edit Todo</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate(editTodo);
              }}
              className="flex flex-col gap-4"
            >
              <input
                type="text"
                placeholder="Todo"
                value={editTodo.todo}
                onChange={(e) => setEditTodo({ ...editTodo, todo: e.target.value })}
                className="border p-3 rounded-lg"
              />
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={editTodo.completed}
                  onChange={(e) => setEditTodo({ ...editTodo, completed: e.target.checked })}
                  className="w-5 h-5"
                />
                <label>Completed</label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all"
                >
                  Save
                </button>
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all"
                  onClick={() => setEditTodo(null)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Todos;