import { compare } from "bcrypt";
import User from "../models/UserModels.js";
import jwt from "jsonwebtoken";
import { request, response } from "express";
import { renameSync, unlinkSync } from "fs";

const maxAge = 3 * 24 * 60 * 60 * 1000;
const createToken = (email, userId) => {
    return jwt.sign({email, userId}, process.env.JWT_KEY, {
        expiresIn : maxAge,
    });
}

export const signup = async(request, response, next) => {
    try {
        const {email, password} = request.body;
        if(!email || !password ){
            return response.status(400).send("email and password are required.")
        }
        const user = await User.create({email, password});
        response.cookie("jwt", createToken(email, user.id), {
            maxAge,
            secure:true,
            sameSite: "None",
        });
        return response.status(201).json({
            user:{
                id:user.id,
                email:user.email,
                profileSetup:user.profileSetup,
            },
        });
    } catch (error) {
        console.log({error});
        return response.status(500).send("internal server error !")
    }
};

export const login = async(request, response, next) => {
    try {
         // Log initial pour vérifier si la fonction est appelée
         console.log("Login function called.");

         // Log pour vérifier le contenu du corps de la requête
         console.log("Request body:", request.body);

        const {email, password} = request.body;
        if(!email || !password ){
            console.log("Missing email or password."); // Log si les champs sont vides

            return response.status(400).send("email and password are required.");
        }
         // Log pour confirmer que l'email est récupéré correctement
         console.log("Email provided:", email);

        const user = await User.findOne({ email });

         // Log si l'utilisateur n'est pas trouvé
        if(!user){
            console.log(`No user found with email: ${email}`);
            return response.status(404).send("user with written email does not exist.");
        }

        // Log pour confirmer que l'utilisateur a été trouvé
        console.log("User found:", user);

        const auth = await compare(password, user.password);
        if(!auth){
            return response.status(400).send("filled password is not correct.");
        }

        // Log pour confirmer que l'utilisateur est authentifié
        console.log("User authenticated successfully.");

        // Log pour voir les informations contenues dans le token
        const token = createToken(email, user.id);
        console.log("Generated token:", token);

        response.cookie("jwt", createToken(email, user.id), {
            maxAge,
            secure:true,
            sameSite: "None",
        });

         // Log pour confirmer que le cookie a été défini
         console.log("JWT cookie set successfully.");
         
        // return response.status(200).json({
        //     user:{
        //         id:user.id,
        //         email:user.email,
        //         profileSetup:user.profileSetup,
        //         firstName:user.firstName,
        //         lastName:user.lastName,
        //         image:user.image,
        //         color:user.color,
        //     },
        // });
        // Log pour vérifier la réponse envoyée
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
         // Log pour capturer et afficher les erreurs
         console.log("Error in login function:", error);
        // console.log({error});
        return response.status(500).send("Erreur du Serveur interne !")
    }
};

export const getUserInfo = async(request, response, next) => {
    try {
        const userData = await User.findById(request.userId) ;
        if(!userData){
            return response.status(404).send("User with the given id filled not found");
        }
        return response.status(200).json({
                id:userData.id,
                email:userData.email,
                profileSetup:userData.profileSetup,
                firstName:userData.firstName,
                lastName:userData.lastName,
                image:userData.image,
                color:userData.color,
        });
    } catch (error) {
        console.log({error});
        return response.status(500).send("Internal server error !")
    }
};

export const updateProfile = async(request, response, next) => {
    try {
        const { userId } = request;
        const { firstName, lastName, color } = request.body;
        if(!firstName || !lastName){
            return response.status(400).send(" firstName, lastName and color are required.");
        }
        const userData = await User.findByIdAndUpdate(
            userId, 
            {
            firstName, 
            lastName, 
            color, 
            profileSetup:true,
        }, 
        { new:true, runValidators: true }
    );

        return response.status(200).json({
                id:userData.id,
                email:userData.email,
                profileSetup:userData.profileSetup,
                firstName:userData.firstName,
                lastName:userData.lastName,
                image:userData.image,
                color:userData.color,
        });
    } catch (error) {
        console.log({error});
        return response.status(500).send("Internal Server error!")
    } 
}

export const addProfileImage = async(request, response, next) => {
    try {
        if(!request.file){
            return response.status(400).send("File is required.");
        }
        const date = Date.now();
        let fileName = "uploads/profiles/" + date + request.file.originalname;
        renameSync(request.file.path, fileName);

        const updatedUser = await User.findByIdAndUpdate(
            request.userId, 
            { image:fileName }, 
            { new:true, runValidators:true } 
        );

        return response.status(200).json({
                image:updatedUser.image,
        });
    } catch (error) {
        console.log({error});
        return response.status(500).send("Internal Server error!")
    } 
}

export const removeProfileImage = async(request, response, next) => {
    try {
        const { userId } = request;
        const user = await User.findById(userId);

        if(!user){
            return response.status(404);send("User not found.")
        }

        if(user.image){
            unlinkSync(user.image)
        }

        user.image=null;
        await user.save();

        return response.status(200).send("Profile image removed successfully !")
    } catch (error) {
        console.log({error});
        return response.status(500).send("Internal Server error!")
    } 
}

export const logout = async (request, response, next) => {
    try {
        
        response.cookie("jwt", "", {maxAge:1, secure:true, sameSite:"None"})
        return response.status(200).send("Logout successful.")
    } catch (error) {
        console.log({error});
        return response.status(500).send("Internal Server error!")
    }  
};

