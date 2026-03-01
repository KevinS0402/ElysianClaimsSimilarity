import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

let db;
let genAI;
let startupStatus = "Initializing...";

try {
  // 1. Local Development (Uses your downloaded JSON file)
  if (fs.existsSync('./serviceAccountKey.json')) {
    const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
  } 
  // 2. Cloud Run (Uses Environment Variables we are about to set)
  else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Cloud Run sometimes escapes newlines in keys, this fixes it:
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      })
    });
  } else {
    throw new Error("Missing Firebase credentials!");
  }
  
  db = getFirestore();
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is missing!");
  }
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  startupStatus = "Healthy";
} catch (error) {
  console.error("Startup Failure:", error);
  startupStatus = error.message;
}

const port = parseInt(process.env.PORT || "8080", 10);

Bun.serve({
  port: port,
  hostname: "0.0.0.0", 
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/" && req.method === "GET") {
      return Response.json({ serverStatus: startupStatus });
    }

    if (url.pathname === "/search" && req.method === "POST") {
      if (startupStatus !== "Healthy") {
         return Response.json({ success: false, error: startupStatus }, { status: 500 });
      }

      try {
        const body = await req.json();
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const result = await model.embedContent(body.query);
        const queryVector = result.embedding.values.slice(0, 768);

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