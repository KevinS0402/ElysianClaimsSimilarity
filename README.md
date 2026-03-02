# 🔍 AI Claims Similarity Finder

**[Try the Live Demo](https://claims-similarity-finder.web.app)**

An AI-powered semantic search engine designed for insurance adjusters. Instead of relying on rigid keyword searches, this application leverages Google's Gemini AI to understand the *meaning* and *context* of unstructured claim descriptions, instantly matching them with the most semantically similar historical claims in the database.

## Tech Stack

* **Frontend:** React Native Web (Expo)
* **Backend:** Bun (Deployed via Google Cloud Run)
* **Database:** Firebase / Firestore (Native Vector Search)
* **AI / Embeddings:** Gemini API (`gemini-embedding-001`)
* **Hosting:** Firebase Hosting

## Key Features

* **Semantic Vector Search:** Translates natural language queries into 768-dimension mathematical vectors to find conceptual matches (e.g., matching "wet shoes" with "slip and fall" claims).
* **Matryoshka Representation Learning:** Dynamically truncates Gemini's 3,072-dimension vectors to 768 dimensions to bypass Firestore constraints without sacrificing search