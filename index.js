const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Google Books API Base
const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

function buildQuery(genre, mood, age, rating, author) {
  let query = "";

  if (genre) query += `+subject:${genre}`;
  if (mood) query += `+intitle:${mood}`;
  if (author) query += `+inauthor:${author}`;
  if (age) query += `+subject:${age}`;

  return query.trim();
}

function formatBookResponse(book) {
  const volume = book.volumeInfo;
  return `📚 *${volume.title}* by *${volume.authors?.join(", ") || "Unknown"}*
⭐ Rating: ${volume.averageRating || "N/A"} (${volume.ratingsCount || 0} reviews)
📖 Description: ${volume.description?.substring(0, 250) || "No description"}...
🔗 [More Info](${volume.infoLink})`;
}

app.post("/recommend", async (req, res) => {
  const { genre, mood, age, rating, author } = req.body;

  try {
    const query = buildQuery(genre, mood, age, rating, author);
    const maxResults = 5;

    const response = await axios.get(`${GOOGLE_BOOKS_API}?q=${query}&maxResults=${maxResults}`);

    const books = response.data.items;

    if (!books || books.length === 0) {
      return res.json({
        generic: [
          {
            response_type: "text",
            text: `Sorry 😢, I couldn't find any books matching your preferences.`,
          },
        ],
      });
    }

    // Filter for high ratings if rating is 'high'
    let filteredBooks = books;
    if (rating?.toLowerCase() === "high") {
      filteredBooks = books.filter(
        (b) => b.volumeInfo?.averageRating >= 4
      );
    }

    // Pick top 1 or 2
    const bookSuggestions = filteredBooks.slice(0, 2).map(formatBookResponse);

    res.json({
      generic: bookSuggestions.map((text) => ({
        response_type: "text",
        text,
      })),
    });
  } catch (error) {
    console.error("Error querying Google Books API:", error.message);
    res.json({
      generic: [
        {
          response_type: "text",
          text: `Oops! Something went wrong while fetching book suggestions 😓`,
        },
      ],
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 BookBot backend running at http://localhost:${PORT}`);
});
