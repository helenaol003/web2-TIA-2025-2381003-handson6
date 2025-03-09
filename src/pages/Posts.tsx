import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import axios from "axios";

// Define Post Type
interface Post {
  id: number;
  title: string;
  body: string;
  tags: string[];
  views: number;
  userId: number;
}

// Fetch all posts
const fetchPosts = async (): Promise<Post[]> => {
  const res = await axios.get("https://dummyjson.com/posts");
  return res.data.posts;
};

// Create a new post
const createPost = async (newPost: Omit<Post, "id" | "views">): Promise<Post> => {
  const res = await axios.post("https://dummyjson.com/posts/add", newPost);
  return res.data;
};

// Update an existing post
const updatePost = async ({ id, ...updatedPost }: Partial<Post> & { id: number }): Promise<Post> => {
  const res = await axios.put(`https://dummyjson.com/posts/${id}`, updatedPost);
  return res.data;
};

// Delete a post
const deletePost = async (id: number): Promise<void> => {
  console.log(`Deleting post with ID: ${id}`);
  await axios.delete(`https://dummyjson.com/posts/${id}`);
};

const Posts = () => {
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState<Omit<Post, "id" | "views">>({
    title: "",
    body: "",
    tags: [],
    userId: 1,
  });
  const [editPost, setEditPost] = useState<Post | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  const createMutation = useMutation({
    mutationFn: createPost,
    onSuccess: (newPost) => {
      queryClient.setQueryData<Post[]>(["posts"], (oldPosts) => [...(oldPosts || []), newPost]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updatePost,
    onSuccess: (updatedPost) => {
      queryClient.setQueryData<Post[]>(["posts"], (oldPosts) =>
        oldPosts?.map((post) => (post.id === updatedPost.id ? updatedPost : post))
      );
      setEditPost(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<Post[]>(["posts"], (oldPosts) =>
        oldPosts?.filter((post) => post.id !== deletedId)
      );
    },
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">List of Posts</h1>

      {/* Create Post Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate(newPost);
          setNewPost({ title: "", body: "", tags: [], userId: 1 });
        }}
        className="flex flex-col gap-4 mb-6 bg-white p-6 shadow-md rounded-lg"
      >
        <input
          type="text"
          placeholder="Title"
          value={newPost.title}
          onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
          className="border p-3 rounded-lg"
        />
        <textarea
          placeholder="Body"
          value={newPost.body}
          onChange={(e) => setNewPost({ ...newPost, body: e.target.value })}
          className="border p-3 rounded-lg"
        />
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={newPost.tags.join(", ")}
          onChange={(e) => setNewPost({ ...newPost, tags: e.target.value.split(", ") })}
          className="border p-3 rounded-lg"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all"
        >
          Add Post
        </button>
      </form>

      {/* List of Posts */}
      {isLoading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {posts?.map((post) => (
            <div key={post.id} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold">{post.title}</h2>
              <p className="text-gray-600 mt-2">{post.body}</p>
              <p className="text-sm text-gray-500 mt-2">Tags: {post.tags.join(", ")}</p>
              <p className="text-sm text-gray-500">Views: {post.views}</p>
              <p className="text-sm text-gray-500">User ID: {post.userId}</p>

              <div className="flex mt-4 gap-2">
                <button
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-all"
                  onClick={() => setEditPost(post)}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all"
                  onClick={() => deleteMutation.mutate(post.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Post Modal */}
      {editPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4">Edit Post</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate(editPost);
              }}
              className="flex flex-col gap-4"
            >
              <input
                type="text"
                placeholder="Title"
                value={editPost.title}
                onChange={(e) => setEditPost({ ...editPost, title: e.target.value })}
                className="border p-3 rounded-lg"
              />
              <textarea
                placeholder="Body"
                value={editPost.body}
                onChange={(e) => setEditPost({ ...editPost, body: e.target.value })}
                className="border p-3 rounded-lg"
              />
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={editPost.tags.join(", ")}
                onChange={(e) => setEditPost({ ...editPost, tags: e.target.value.split(", ") })}
                className="border p-3 rounded-lg"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all"
                >
                  Save
                </button>
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all"
                  onClick={() => setEditPost(null)}
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

export default Posts;
