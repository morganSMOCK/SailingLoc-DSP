// server/db.js
import mongoose from "mongoose";

// Remplace <username>, <password> et <dbname> par tes infos MongoDB Atlas
const uri = "mongodb+srv://ProjetM1G2:<Thc8XKw6dpfs0Aag>@projetm1g2.vmsnfdz.mongodb.net/?retryWrites=true&w=majority&appName=ProjetM1G2";

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connecté !");
  } catch (err) {
    console.error("❌ Erreur de connexion à MongoDB :", err.message);
    process.exit(1);
  }
};

export default connectDB;
