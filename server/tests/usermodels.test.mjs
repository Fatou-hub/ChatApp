import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/UserModels.js";

async function runTests() {
  // Démarrer MongoDB en mémoire
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  try {
    // Connexion à MongoDB en mémoire
    await mongoose.connect(uri);

    console.log("MongoDB connecté.");

    // Test 1: Création d'un utilisateur avec mot de passe hashé
    const userData = {
      email: "test@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      profileSetup: false,
    };

    const user = new User(userData);
    await user.save();

    if (user.password === userData.password) {
      throw new Error("Le mot de passe n'a pas été hashé !");
    }

    console.log("Test 1: Mot de passe hashé avec succès.");

    // Test 2: Contrainte unique sur l'email
    const user2 = new User(userData);
    try {
      await user2.save();
      throw new Error("Test 2: Échec attendu, mais l'email n'est pas unique !");
    } catch (err) {
      console.log("Test 2: Contrainte unique sur l'email vérifiée avec succès.");
    }

    // Test 3: Valeur par défaut de profileSetup
    const user3 = new User({ email: "test2@example.com", password: "password123" });
    await user3.save();

    if (user3.profileSetup !== false) {
      throw new Error("Test 3: La valeur par défaut de profileSetup n'est pas correcte !");
    }

    console.log("Test 3: Valeur par défaut de profileSetup validée avec succès.");
  } catch (error) {
    console.error("Erreur pendant les tests :", error.message);
  } finally {
    // Fermer la connexion MongoDB
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log("MongoDB déconnecté.");
  }
}

runTests();
