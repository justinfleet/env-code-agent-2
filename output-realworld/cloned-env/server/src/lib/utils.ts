import slugify from 'slugify';

export function createSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
}

export function formatUser(user: any, token?: string) {
  return {
    email: user.email,
    token: token || '',
    username: user.username,
    bio: user.bio || '',
    image: user.image || ''
  };
}

export function formatProfile(user: any, following = false) {
  return {
    username: user.username,
    bio: user.bio || '',
    image: user.image || '',
    following
  };
}

export function formatArticle(article: any, author: any, favorited = false, following = false) {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tagList || [],
    createdAt: article.created_at,
    updatedAt: article.updated_at,
    favorited,
    favoritesCount: article.favorites_count || 0,
    author: formatProfile(author, following)
  };
}

export function formatComment(comment: any, author: any, following = false) {
  return {
    id: comment.id,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    body: comment.body,
    author: formatProfile(author, following)
  };
}