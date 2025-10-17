import { getPostById } from '@/lib/client-api';

async function getPostContent(postId: string) {
  try {
    const post = await getPostById(postId);
    if (post) {
      console.log('Post content:');
      console.log(post.content);
    } else {
      console.log('Post not found');
    }
  } catch (error) {
    console.error('Error fetching post:', error);
  }
}

// Get the post ID from command line arguments
const postId = process.argv[2];
if (postId) {
  getPostContent(postId);
} else {
  console.log('Please provide a post ID as an argument');
}