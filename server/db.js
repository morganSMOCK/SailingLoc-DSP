import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";

dotenv.config({ path: path.join(__dirname, '.env') });
const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ MONGO_URI non défini. Vérifie ton fichier .env !");
  process.exit(1);
}

const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connecté !");
  } catch (err) {
    console.error("❌ Erreur de connexion à MongoDB :", err.message);
    process.exit(1);
  }
};

export default connectDB;
