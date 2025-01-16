// Function to fetch all posts and display them with comments and replies
async function fetchPosts() {
    const postsContainer = document.getElementById('posts-container');
    postsContainer.innerHTML = '';  // Clear previous posts

    try {
        const response = await fetch('/posts');
        const posts = await response.json();

        posts.forEach(post => {
            const postDiv = document.createElement('div');
            postDiv.classList.add('post-item');
            postDiv.innerHTML = `
                <p>${post.text}</p>
                ${post.media ? `<img src="${post.media}" alt="Post Media" />` : ''}
                <div class="post-actions">
                    <button onclick="likePost(${post.id})">Like (${post.likes})</button>
                    <form onsubmit="commentPost(event, ${post.id})">
                        <input type="text" placeholder="Comment" required />
                        <button type="submit">Comment</button>
                    </form>
                    <div class="comments">
                        ${post.comments.map(comment => `
                            <p>${comment.text} <small>${comment.timestamp}</small></p>
                            <button onclick="toggleReplyForm(${comment.id})">Reply</button>
                            <div class="replies">
                                ${comment.replies.map(reply => `
                                    <p><em>Reply:</em> ${reply.text} <small>${reply.timestamp}</small></p>
                                `).join('')}
                            </div>
                            <form class="reply-form" id="reply-form-${comment.id}" onsubmit="replyToComment(event, ${comment.id})" style="display:none;">
                                <input type="text" placeholder="Reply" required />
                                <button type="submit">Reply</button>
                            </form>
                        `).join('')}
                    </div>
                </div>
            `;
            postsContainer.appendChild(postDiv);
        });
    } catch (err) {
        console.error('Error fetching posts:', err);
    }
}

// Function to like a post
async function likePost(postId) {
    try {
        const response = await fetch(`/posts/${postId}/like`, { method: 'POST' });
        const updatedPost = await response.json();
        fetchPosts();  // Re-fetch posts after liking
    } catch (err) {
        console.error('Error liking post:', err);
    }
}

// Function to comment on a post
async function commentPost(event, postId) {
    event.preventDefault();

    const commentText = event.target.querySelector('input').value;

    try {
        const response = await fetch(`/posts/${postId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: commentText })
        });
        const updatedPost = await response.json();
        fetchPosts();  // Re-fetch posts after commenting
    } catch (err) {
        console.error('Error commenting on post:', err);
    }
}

// Function to toggle reply form visibility
function toggleReplyForm(commentId) {
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
}

// Function to reply to a comment
async function replyToComment(event, parentCommentId) {
    event.preventDefault();

    const replyText = event.target.querySelector('input').value;

    try {
        const response = await fetch(`/posts/${parentCommentId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: replyText, parentCommentId })
        });
        const updatedPost = await response.json();
        fetchPosts();  // Re-fetch posts after replying
    } catch (err) {
        console.error('Error replying to comment:', err);
    }
}

// Fetch posts when the page loads
window.onload = fetchPosts;
