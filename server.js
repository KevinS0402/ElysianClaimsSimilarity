import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import serviceAccount from './serviceAccountKey.json';

// 1. Initialize the secure Admin SDK
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log("Starting Bun Vector Search Server on port 3000...");

// 2. Start the local server
Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Listen for POST requests on the /search route
    if (url.pathname === "/search" && req.method === "POST") {
      try {
        const body = await req.json();
        console.log(`\nAdjuster Query: "${body.query}"`);

        // A. Turn the user's search text into a vector using Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const result = await model.embedContent(body.query);
        const queryVector = result.embedding.values;

        // B. Perform the Nearest Neighbor Vector Search in Firestore
        const claimsRef = db.collection('claims');
        const vectorQuery = claimsRef.findNearest(
          'embedding', 
          FieldValue.vector(queryVector), 
          {
            limit: 5, // Return top 5 most similar past claims
            distanceMeasure: 'COSINE' 
          }
        );

        const snapshot = await vectorQuery.get();
        
        // C. Clean up the results
        const matches = snapshot.docs.map(doc => {
           const data = doc.data();
           delete data.embedding; // Strip out the massive array so the app stays fast
           return { id: doc.id, ...data };
        });

        console.log(`Found ${matches.length} similar claims.`);
        return Response.json({ success: true, results: matches });

      } catch (error) {
        console.error("Search failed:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    return new Response("Endpoint Not Found", { status: 404 });
  }
});