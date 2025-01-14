import { compare } from "bcrypt";
import User from "../models/UserModels.js";
import jwt from "jsonwebtoken";
import { request, response } from "express";
import { renameSync, unlinkSync } from "fs";
import xss from "xss";  // Importation de la bibliothèque pour assainir les entrées

const maxAge = 3 * 24 * 60 * 60 * 1000;

// Fonction pour créer un token JWT
const createToken = (email, userId) => {
    return jwt.sign({ email, userId }, process.env.JWT_KEY, {
        expiresIn: maxAge,
    });
}

// Fonction pour l'inscription
export const signup = async (request, response, next) => {
    try {
        let { email, password } = request.body;

        // Protection XSS : assainir l'email pour éviter les injections de scripts
        email = xss(email);  // Nettoyage de l'email

        // Vérification des entrées
        if (!email || !password) {
            return response.status(400).send("Email and password are required.");
        }

        // Création de l'utilisateur
        const user = await User.create({ email, password });

        // Création du token JWT
        response.cookie("jwt", createToken(email, user.id), {
            maxAge,
            secure: true,
            sameSite: "None",
            httpOnly: true,  // Ajout de l'attribut httpOnly
        });

        return response.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                profileSetup: user.profileSetup,
            },
        });
    } catch (error) {
        console.log({ error });
        return response.status(500).send("Internal server error!");
    }
};

// Fonction pour la connexion
export const login = async (request, response, next) => {
    try {
        console.log("Login function called.");
        console.log("Request body:", request.body);

        let { email, password } = request.body;

        // Protection XSS : assainir l'email pour éviter les injections de scripts
        email = xss(email);  // Nettoyage de l'email

        if (!email || !password) {
            console.log("Missing email or password.");
            return response.status(400).send("Email and password are required.");
        }

        console.log("Email provided:", email);

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`No user found with email: ${email}`);
            return response.status(404).send("User with this email does not exist.");
        }

        console.log("User found:", user);

        const auth = await compare(password, user.password);
        if (!auth) {
            return response.status(400).send("Password is incorrect.");
        }

        console.log("User authenticated successfully.");

        const token = createToken(email, user.id);
        console.log("Generated token:", token);

        response.cookie("jwt", createToken(email, user.id), {
            maxAge,
            secure: true,
            sameSite: "None",
            httpOnly: true,  // Ajout de l'attribut httpOnly
        });

        console.log("JWT cookie set successfully.");

        const userResponse = {
            id: user.id,
            email: user.email,
            profileSetup: user.profileSetup,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
            color: user.color,
        };

        console.log("Response data:", userResponse);

        return response.status(200).json({ user: userResponse });
    } catch (error) {
        console.log("Error in login function:", error);
        return response.status(500).send("Internal server error!");
    }
};

// Fonction pour obtenir les informations de l'utilisateur
export const getUserInfo = async (request, response, next) => {
    try {
        const userData = await User.findById(request.userId);
        if (!userData) {
            return response.status(404).send("User with the given ID not found.");
        }

        return response.status(200).json({
            id: userData.id,
            email: userData.email,
            profileSetup: userData.profileSetup,
            firstName: userData.firstName,
            lastName: userData.lastName,
            image: userData.image,
            color: userData.color,
        });
    } catch (error) {
        console.log({ error });
        return response.status(500).send("Internal server error!");
    }
};

// Fonction pour mettre à jour le profil de l'utilisateur
export const updateProfile = async (request, response, next) => {
    try {
        const { userId } = request;
        const { firstName, lastName, color } = request.body;

        if (!firstName || !lastName) {
            return response.status(400).send("firstName, lastName, and color are required.");
        }

        const userData = await User.findByIdAndUpdate(
            userId,
            {
                firstName,
                lastName,
                color,
                profileSetup: true,
            },
            { new: true, runValidators: true }
        );

        return response.status(200).json({
            id: userData.id,
            email: userData.email,
            profileSetup: userData.profileSetup,
            firstName: userData.firstName,
            lastName: userData.lastName,
            image: userData.image,
            color: userData.color,
        });
    } catch (error) {
        console.log({ error });
        return response.status(500).send("Internal server error!");
    }
};

// Fonction pour ajouter une image de profil
export const addProfileImage = async (request, response, next) => {
    try {
        if (!request.file) {
            return response.status(400).send("File is required.");
        }

        const date = Date.now();
        let fileName = "uploads/profiles/" + date + request.file.originalname;
        renameSync(request.file.path, fileName);

        const updatedUser = await User.findByIdAndUpdate(
            request.userId,
            { image: fileName },
            { new: true, runValidators: true }
        );

        return response.status(200).json({
            image: updatedUser.image,
        });
    } catch (error) {
        console.log({ error });
        return response.status(500).send("Internal server error!");
    }
};

// Fonction pour supprimer l'image de profil
export const removeProfileImage = async (request, response, next) => {
    try {
        const { userId } = request;
        const user = await User.findById(userId);

        if (!user) {
            return response.status(404).send("User not found.");
        }

        if (user.image) {
            unlinkSync(user.image);
        }

        user.image = null;
        await user.save();

        return response.status(200).send("Profile image removed successfully!");
    } catch (error) {
        console.log({ error });
        return response.status(500).send("Internal server error!");
    }
};

// Fonction pour se déconnecter
export const logout = async (request, response, next) => {
    try {
        response.cookie("jwt", "", { maxAge: 1, secure: true, sameSite: "None", httpOnly: true });
        return response.status(200).send("Logout successful.");
    } catch (error) {
        console.log({ error });
        return response.status(500).send("Internal server error!");
    }
};
