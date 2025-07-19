import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('/api/posts');
      setPosts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Awesome Web App</h1>
      </header>
      <main>
        <div className="posts-container">
          {posts.map(post => (
            <div key={post._id} className="post-card">
              <h3>{post.title}</h3>
              <p>{post.content}</p>
              <small>By {post.author} on {new Date(post.createdAt).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;

