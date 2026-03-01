import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; 
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sampleClaim = {
  id: "CLM-001",
  type: "Commercial Property",
  loss: "Water Damage",
  description: "Burst pipe in office building caused flooding on floors 2-3. Damaged carpet, drywall, and computer equipment. Building was 15 years old with original plumbing.",
  status: "Settled",
  amount: 145000
};

async function seedDatabase() {
  try {
    console.log("Generating embedding with Gemini...");
    
    // Composite string for maximum semantic context
    const textToEmbed = `Type: ${sampleClaim.type}. Loss: ${sampleClaim.loss}. Description: ${sampleClaim.description}`;

    // Initialize the embedding model
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    
    // Call the API to generate the vector
    const result = await model.embedContent(textToEmbed);
    const embeddingVector = result.embedding.values.slice(0, 768);

    console.log(`Successfully generated vector of length: ${embeddingVector.length}`);
    console.log("Saving to Firestore...");
    
    // Save the record and the embedding array to Firestore
    const docRef = await addDoc(collection(db, "claims"), {
      ...sampleClaim,
      embedding: embeddingVector
    });

    console.log("Success! Claim saved with ID: ", docRef.id);
    process.exit(0);
    
  } catch (error) {
    console.error("Error seeding database: ", error);
    process.exit(1);
  }
}

seedDatabase();