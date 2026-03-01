import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

let db;
let genAI;
let startupStatus = "Initializing...";

// 1. Safe Initialization: Catch errors but DO NOT crash the server
try {
  if (fs.existsSync('./serviceAccountKey.json')) {
    const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    // Cloud Run will automatically use Default Credentials
    initializeApp();
  }
  db = getFirestore();
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is missing in Cloud Run!");
  }
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  startupStatus = "Healthy";
} catch (error) {
  console.error("Startup Failure:", error);
  startupStatus = error.message; // Save the error to display in the browser
}

const port = parseInt(process.env.PORT || "8080", 10);

// 2. Start the server regardless of initialization errors
Bun.serve({
  port: port,
  hostname: "0.0.0.0", 
  async fetch(req) {
    const url = new URL(req.url);

    // --- NEW HEALTH CHECK ROUTE ---
    // You can visit your Cloud Run URL in a browser to see if it worked
    if (url.pathname === "/" && req.method === "GET") {
      return Response.json({ serverStatus: startupStatus });
    }

    // --- SEARCH ROUTE ---
    if (url.pathname === "/search" && req.method === "POST") {
      // If the server failed to boot properly, return the error to the app
      if (startupStatus !== "Healthy") {
         return Response.json({ success: false, error: startupStatus }, { status: 500 });
      }

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