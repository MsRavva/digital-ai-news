// Реэкспорт функций из firebase-db-core.ts
export {
  db,
  auth,
  storage,
  convertTimestampToISO,
  getPosts,
  getPostById,
  createPost,
  getPostStats
} from './firebase-db-core';

// Реэкспорт функций из firebase-db-extended.ts
export {
  getPaginatedPosts,
  getArchivedPosts,
  getPostsByCategory,
  getPostsByAuthor,
  getPostsByTag,
  getAllTags,
  getCommentsByPostId,
  addComment,
  likeComment,
  unlikeComment,
  hasUserLikedComment,
  likePost,
  hasUserLikedPost,
  toggleBookmark,
  hasUserBookmarkedPost,
  getBookmarkedPosts,
  archivePost,
  unarchivePost,
  togglePinPost,
  deleteComment,
  // Переименованные функции для избежания конфликтов
  recordView as recordViewExtended,
  updatePost as updatePostExtended,
  deletePost as deletePostExtended
} from './firebase-db-extended';
