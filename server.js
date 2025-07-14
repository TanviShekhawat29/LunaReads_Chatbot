const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/recommend', async (req, res) => {
  const { genre, mood, author, age, rating } = req.body;

  // Construct the query string
  let query = '';
  if (genre) query += `subject:${genre} `;
  if (author) query += `inauthor:${author} `;
  if (mood) query += `${mood} `;
  if (age) query += `${age} `;
  query = query.trim();

  try {
    const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
      params: {
        q: query,
        orderBy: 'relevance',
        maxResults: 5,
        printType: 'books',
        key: process.env.GOOGLE_BOOKS_API_KEY,
      },
    });

    const books = response.data.items;

    if (!books || books.length === 0) {
      return res.json({
        webhook_result_1: "😕 Sorry, I couldn't find a good match. Try changing your preferences?",
      });
    }

    // Pick top-rated or most relevant book
    const book = books[0].volumeInfo;
    const title = book.title || 'Unknown Title';
    const bookAuthor = book.authors ? book.authors.join(', ') : 'Unknown Author';
    const description = book.description ? book.description.slice(0, 200) + '...' : 'No description available.';
    const infoLink = book.infoLink || '';

    const result = `📚 **${title}** by *${bookAuthor}*\n\n${description}\n[More Info](${infoLink})`;

    return res.json({
      webhook_result_1: result,
    });

  } catch (error) {
    console.error('Error fetching from Google Books:', error.message);
    return res.json({
      webhook_result_1: "🚨 Oops! Something went wrong while getting your book. Please try again later.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`📘 LunaReads backend running at http://localhost:${PORT}`);
});
