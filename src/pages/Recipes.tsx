import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import axios from "axios";

interface Recipe {
  id: number;
  name: string;
  ingredients: string[];
  instructions: string;
}

// Fetch all recipes
const fetchRecipes = async (): Promise<Recipe[]> => {
  const res = await axios.get("https://dummyjson.com/recipes");
  return res.data.recipes;
};

// Create a new recipe
const createRecipe = async (newRecipe: Omit<Recipe, "id">): Promise<Recipe> => {
  const res = await axios.post("https://dummyjson.com/recipes/add", newRecipe);
  return res.data;
};

// Update an existing recipe
const updateRecipe = async (recipe: Recipe): Promise<Recipe> => {
  const res = await axios.put(`https://dummyjson.com/recipes/${recipe.id}`, {
    name: recipe.name,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
  });
  return res.data;
};

// Delete a recipe
const deleteRecipe = async (id: number): Promise<void> => {
  console.log(`Deleting recipe with ID: ${id}`);
  await axios.delete(`https://dummyjson.com/recipes/${id}`);
};

const Recipes = () => {
  const queryClient = useQueryClient();
  const [recipeForm, setRecipeForm] = useState<Omit<Recipe, "id"> | Recipe>({
    id: 0, // Add id field to track updates
    name: "",
    ingredients: [],
    instructions: "",
  });
  const [editing, setEditing] = useState<boolean>(false);

  const { data: recipes, isLoading } = useQuery({
    queryKey: ["recipes"],
    queryFn: fetchRecipes,
  });

  const createMutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: (data) => {
      queryClient.setQueryData(["recipes"], (old: Recipe[] | undefined) =>
        old ? [...old, data] : [data]
      );
      console.log("Recipe added successfully!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateRecipe,
    onSuccess: (updatedRecipe) => {
      queryClient.setQueryData(["recipes"], (old: Recipe[] | undefined) =>
        old ? old.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r)) : []
      );
      setEditing(false);
      setRecipeForm({ id: 0, name: "", ingredients: [], instructions: "" });
      console.log("Recipe updated successfully!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecipe,
    onSuccess: (_, id) => {
      queryClient.setQueryData(["recipes"], (old: Recipe[] | undefined) =>
        old ? old.filter((r) => r.id !== id) : []
      );
      console.log("Recipe deleted successfully!");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing && "id" in recipeForm) {
      updateMutation.mutate(recipeForm as Recipe);
    } else {
      createMutation.mutate({
        name: recipeForm.name,
        ingredients: recipeForm.ingredients,
        instructions: recipeForm.instructions,
      });
    }
    setRecipeForm({ id: 0, name: "", ingredients: [], instructions: "" });
    setEditing(false);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">List of Recipes</h1>

      {/* Recipe Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6 bg-white p-6 shadow-md rounded-lg">
        <input
          type="text"
          placeholder="Name"
          value={recipeForm.name}
          onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
          className="border p-3 rounded-lg"
        />
        <input
          type="text"
          placeholder="Ingredients (comma separated)"
          value={recipeForm.ingredients.join(", ")}
          onChange={(e) => setRecipeForm({ ...recipeForm, ingredients: e.target.value.split(", ") })}
          className="border p-3 rounded-lg"
        />
        <textarea
          placeholder="Instructions"
          value={recipeForm.instructions}
          onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
          className="border p-3 rounded-lg"
        />
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all">
          {editing ? "Save Changes" : "Add Recipe"}
        </button>
        {editing && (
          <button
            type="button"
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all"
            onClick={() => {
              setEditing(false);
              setRecipeForm({ id: 0, name: "", ingredients: [], instructions: "" });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* Recipe List */}
      {isLoading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {recipes?.map((recipe) => (
            <div key={recipe.id} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold">{recipe.name}</h2>
              <p className="text-gray-600 mt-2">Ingredients: {recipe.ingredients.join(", ")}</p>
              <p className="text-gray-600 mt-2">Instructions: {recipe.instructions}</p>
              <div className="flex mt-4 gap-2">
                <button
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-all"
                  onClick={() => {
                    setRecipeForm(recipe);
                    setEditing(true);
                  }}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all"
                  onClick={() => deleteMutation.mutate(recipe.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recipes;