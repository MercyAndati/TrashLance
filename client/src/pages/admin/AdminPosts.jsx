import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, Trash2 } from "lucide-react"
import api from "../../services/api"
import LoadingSpinner from "../../components/common/LoadingSpinner"

const AdminPosts = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await api.get("/posts?limit=100")
      setPosts(response.data.data.docs || [])
    } catch (error) {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return
    try {
      await api.delete(`/posts/${postId}`)
      setPosts((prev) => prev.filter((p) => p._id !== postId))
    } catch (error) {
      alert("Failed to delete post.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Posts</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">View and manage all posts on the platform</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {posts.map((post) => (
                  <tr key={post._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/posts/${post._id}`} className="text-blue-600 hover:underline">
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{post.author?.username || "Unknown"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{post.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(post.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-2">
                      <Link to={`/posts/${post._id}`} className="text-green-600 hover:text-green-800" title="View">
                        <Eye className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete post"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPosts 