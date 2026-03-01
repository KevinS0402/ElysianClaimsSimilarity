import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

// 1. Bulletproof Authentication using native fs
if (fs.existsSync('./serviceAccountKey.json')) {
  const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
  initializeApp({ credential: cert(serviceAccount) });
  console.log("Local development: Using service account key.");
} else {
  initializeApp();
  console.log("Cloud environment: Using Google Application Default Credentials.");
}

const db = getFirestore();

// 2. Prevent silent crashes if the API key is missing
if (!process.env.GEMINI_API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY is missing from the environment variables!");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 3. Ensure port is strictly a number
const port = parseInt(process.env.PORT || "8080", 10);

Bun.serve({
  port: port,
  hostname: "0.0.0.0", 
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/search" && req.method === "POST") {
      try {
        const body = await req.json();
        
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const result = await model.embedContent(body.query);
        const queryVector = result.embedding.values;

        const claimsRef = db.collection('claims');
        const vectorQuery = claimsRef.findNearest(
          'embedding', 
          FieldValue.vector(queryVector), 
          { limit: 5, distanceMeasure: 'COSINE' }
        );

        const snapshot = await vectorQuery.get();
        
        const matches = snapshot.docs.map(doc => {
           const data = doc.data();
           delete data.embedding; 
           return { id: doc.id, ...data };
        });

        return Response.json({ success: true, results: matches });

      } catch (error) {
        console.error("Search failed:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
      }
    }
    return new Response("Endpoint Not Found", { status: 404 });
  }
});

console.log(`Bun server actively listening on port ${port}...`);