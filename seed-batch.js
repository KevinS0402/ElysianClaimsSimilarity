import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

// 1. Authenticate exactly like your server does
const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const mockClaims = [
  { id: "CLM-001", type: "Commercial Property", loss: "Water Damage", status: "Settled", amount: 145000, description: "Burst pipe in office building caused flooding on floors 2-3. Damaged carpet, drywall, and computer equipment. Building was 15 years old with original plumbing." },
  { id: "CLM-002", type: "Commercial Property", loss: "Fire", status: "Settled", amount: 320000, description: "Kitchen fire in restaurant spread to dining area. Extensive smoke damage throughout. Fire suppression system activated but delayed." },
  { id: "CLM-003", type: "General Liability", loss: "Slip and Fall", status: "Litigated", amount: 89000, description: "Customer slipped on wet floor in retail store. Claimed back injury requiring surgery. Store had 'wet floor' sign but placement disputed." },
  { id: "CLM-004", type: "Commercial Auto", loss: "Collision", status: "Settled", amount: 34000, description: "Company delivery truck rear-ended at stoplight. Driver claimed whiplash. Other driver cited for following too closely." },
  { id: "CLM-005", type: "Commercial Property", loss: "Theft", status: "Settled", amount: 78000, description: "Break-in at warehouse. Electronics inventory stolen. Alarm system was offline for maintenance at time of theft." },
  { id: "CLM-006", type: "General Liability", loss: "Product Liability", status: "Settled", amount: 45000, description: "Customer claimed allergic reaction to cosmetic product. No warning label for specific ingredient. Required emergency room visit." },
  { id: "CLM-007", type: "Commercial Property", loss: "Water Damage", status: "Open", amount: 156000, description: "Roof leak during storm damaged retail inventory. Tenant claims landlord ignored previous leak reports. Dispute over maintenance responsibility." },
  { id: "CLM-008", type: "Professional Liability", loss: "Errors & Omissions", status: "Settled", amount: 62000, description: "Accounting firm missed tax deadline for client. Client incurred $50K in penalties. Firm claims client provided documents late." },
  { id: "CLM-009", type: "Commercial Auto", loss: "Collision", status: "Settled", amount: 28000, description: "Sales rep's vehicle hit pedestrian in parking lot. Low speed but pedestrian claimed knee injury. Dashcam footage available." },
  { id: "CLM-010", type: "General Liability", loss: "Bodily Injury", status: "Litigated", amount: 210000, description: "Contractor's employee fell through ceiling while working in client's building. Disputed whether proper safety equipment was provided." },
  { id: "CLM-011", type: "Commercial Property", loss: "Fire", status: "Settled", amount: 445000, description: "Electrical fire in storage unit facility. Multiple tenants' property destroyed. Origin traced to faulty wiring in unit 47." },
  { id: "CLM-012", type: "Commercial Property", loss: "Water Damage", status: "Settled", amount: 230000, description: "HVAC condensation leak damaged server room. IT equipment and data recovery costs. Maintenance records show missed inspections." },
  { id: "CLM-013", type: "General Liability", loss: "Slip and Fall", status: "Open", amount: 95000, description: "Employee of visiting vendor fell on icy sidewalk outside office building. Building management responsible for snow removal per lease." },
  { id: "CLM-014", type: "Commercial Auto", loss: "Collision", status: "Litigated", amount: 156000, description: "Fleet vehicle T-boned at intersection. Other driver ran red light but disputed. No traffic camera. Two witness statements conflict." },
  { id: "CLM-015", type: "Professional Liability", loss: "Errors & Omissions", status: "Open", amount: 175000, description: "Software consultant's code caused client's e-commerce site to crash during Black Friday. Client claims $200K in lost sales." }
];

async function seedBatch() {
  console.log(`Starting to seed ${mockClaims.length} claims with true Vector types...`);
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

  for (const claim of mockClaims) {
    try {
      const textToEmbed = `Type: ${claim.type}. Loss: ${claim.loss}. Description: ${claim.description}`;
      const result = await model.embedContent(textToEmbed);
      const embeddingArray = result.embedding.values.slice(0, 768); 

      // 2. The crucial fix: Tell Firestore this is a Vector, not just an array!
      await db.collection("claims").doc(claim.id).set({
        ...claim,
        embedding: FieldValue.vector(embeddingArray) 
      });
      console.log(`✅ Saved Vector: ${claim.id} - ${claim.loss}`);
    } catch (error) {
      console.error(`❌ Failed to save ${claim.id}:`, error);
    }
  }
  
  console.log("\n🎉 Batch seeding complete! Your index will pick these up instantly.");
  process.exit(0);
}

seedBatch();