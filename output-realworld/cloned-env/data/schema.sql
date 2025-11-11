-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    bio TEXT,
    image TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Articles table
CREATE TABLE articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    body TEXT NOT NULL,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    favorites_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- Article-tags junction table
CREATE TABLE article_tags (
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- Comments table
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    body TEXT NOT NULL,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Favorites junction table
CREATE TABLE favorites (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, article_id)
);

-- Follows junction table
CREATE TABLE follows (
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id)
);

-- Insert sample data
INSERT INTO users (username, email, password_hash, bio, image) VALUES
('johndoe', 'john@example.com', '$2b$10$example.hash.password', 'I love writing!', 'https://example.com/john.jpg'),
('janedoe', 'jane@example.com', '$2b$10$example.hash.password2', 'Tech enthusiast', 'https://example.com/jane.jpg'),
('testuser', 'test@example.com', '$2b$10$example.hash.password3', 'Just testing things out', null);

INSERT INTO tags (name) VALUES
('react'),
('javascript'),
('programming'),
('web-development'),
('tutorial');

INSERT INTO articles (slug, title, description, body, author_id, favorites_count) VALUES
('how-to-train-your-dragon', 'How to train your dragon', 'Ever wonder how?', 'It takes a Jacobian. More details...', 1, 2),
('getting-started-with-react', 'Getting Started with React', 'A comprehensive guide', 'React is a JavaScript library for building user interfaces...', 2, 1),
('javascript-best-practices', 'JavaScript Best Practices', 'Tips for better code', 'Here are some essential JavaScript best practices...', 1, 0);

INSERT INTO article_tags (article_id, tag_id) VALUES
(1, 3),
(2, 1),
(2, 2),
(2, 4),
(3, 2),
(3, 3);

INSERT INTO comments (body, article_id, author_id) VALUES
('Great article! Very helpful.', 1, 2),
('Thanks for sharing this.', 2, 1),
('Could you add more examples?', 2, 3);

INSERT INTO favorites (user_id, article_id) VALUES
(2, 1),
(3, 1),
(1, 2);

INSERT INTO follows (follower_id, following_id) VALUES
(2, 1),
(3, 1),
(1, 2);