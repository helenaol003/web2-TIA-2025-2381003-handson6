import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import axios from "axios";

// Define Comment Type
interface Comment {
  id: number;
  body: string;
}

// Fetch all comments
const fetchComments = async (): Promise<Comment[]> => {
  const res = await axios.get("https://dummyjson.com/comments");
  return res.data.comments;
};

// Create a new comment (Fixed)
const createComment = async (newComment: Omit<Comment, "id">): Promise<Comment> => {
  const res = await axios.post("https://dummyjson.com/comments/add", {
    body: newComment.body,
    postId: 1, // Required by DummyJSON
    userId: 1, // Required by DummyJSON
  });
  
  // Return the comment from the API response
  return res.data;
};

// Update an existing comment
const updateComment = async (updatedComment: Comment): Promise<Comment> => {
  const res = await axios.put(`https://dummyjson.com/comments/${updatedComment.id}`, {
    body: updatedComment.body,
  });
  return { id: updatedComment.id, body: res.data.body };
};

// Delete a comment
const deleteComment = async (id: number): Promise<void> => {
  await axios.delete(`https://dummyjson.com/comments/${id}`);
};

const Comments = () => {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState({ body: "" });
  const [editComment, setEditComment] = useState<Comment | null>(null);

  // Fetch Comments
  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments"],
    queryFn: fetchComments,
  });

  // Create Comment Mutation (Fixed)
  const createMutation = useMutation({
    mutationFn: createComment,
    onSuccess: (data) => {
      // Update the cache with the new comment from the API
      queryClient.setQueryData<Comment[]>(["comments"], (oldComments = []) => [
        data,
        ...oldComments,
      ]);
      
      setNewComment({ body: "" }); // Clear input field
    },
    onError: (error) => {
      console.error("Failed to add comment:", error);
    },
  });

  // Update Comment Mutation
  const updateMutation = useMutation({
    mutationFn: updateComment,
    onSuccess: (updatedComment) => {
      queryClient.setQueryData<Comment[]>(["comments"], (oldComments) =>
        oldComments?.map((comment) => (comment.id === updatedComment.id ? updatedComment : comment))
      );
      setEditComment(null);
    },
  });

  // Delete Comment Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<Comment[]>(["comments"], (oldComments) =>
        oldComments?.filter((comment) => comment.id !== deletedId)
      );
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.body.trim()) {
      createMutation.mutate(newComment);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Comments</h1>

      {/* Create Comment Form */}
      <form
        onSubmit={handleAddComment}
        className="flex flex-col gap-4 mb-6 bg-white p-6 shadow-md rounded-lg"
      >
        <input
          type="text"
          placeholder="Write a comment..."
          value={newComment.body}
          onChange={(e) => setNewComment({ body: e.target.value })}
          className="border p-3 rounded-lg"
        />
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all disabled:bg-blue-300"
        >
          {createMutation.isPending ? "Adding..." : "Add Comment"}
        </button>
      </form>

      {/* List of Comments */}
      {isLoading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {comments?.map((comment) => (
            <div key={comment.id} className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600">{comment.body}</p>

              <div className="flex mt-4 gap-2">
                <button
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-all"
                  onClick={() => setEditComment(comment)}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all"
                  onClick={() => deleteMutation.mutate(comment.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Comment Modal */}
      {editComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4">Edit Comment</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate(editComment);
              }}
              className="flex flex-col gap-4"
            >
              <input
                type="text"
                placeholder="Comment"
                value={editComment.body}
                onChange={(e) => setEditComment({ ...editComment, body: e.target.value })}
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
                  onClick={() => setEditComment(null)}
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

export default Comments;