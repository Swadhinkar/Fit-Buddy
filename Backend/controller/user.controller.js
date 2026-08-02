import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../model/user.model.js'
import { generateToken, generateRefreshToken } from '../utils/token.js'
import mongoose from 'mongoose'

export const registerUser = async (req, res) => {
    if (!req.body) {
        return res.status(400).send({ message: "Content body missing" })
    }

    const { username, email, password, age, gender } = req.body

    try {
        // Optimization A: Ensure your Mongoose User model has { unique: true, index: true } on email
        const user = await User.findOne({ email })

        if (user) {
            return res.status(400).send({ message: "User already exists" })
        }

        const HashedPassword = await bcrypt.hash(password, 10)
        
        // Optimization B: Pre-generate the object ID locally in Node.js
        const newUserId = new mongoose.Types.ObjectId();
        
        // Generate tokens instantly using the pre-allocated ID
        const accessToken = generateToken(newUserId)
        const refreshToken = generateRefreshToken(newUserId)

        // Optimization C: Create the document with the token included from day one
        const newUser = new User({
            _id: newUserId, // Pass the generated ID
            name: username,
            email: email,
            password: HashedPassword,
            age: age,
            gender: gender,
            refreshToken: refreshToken // Token added here!
        })

        // ONLY ONE WRITE OPERATION NEEDED NOW 🎉
        await newUser.save() 
        
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        };

        return res.cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .status(201)
            .send({ message: "User registered successfully" })

    } catch (err) {
        console.error("Signup Error:", err); // Log your errors to see what fails
        return res.status(500).send({ message: "Internal Server Error when registering user" })
    }
}


export const loginUser = async (req, res) => {
    if (!req.body)
        return res.status(400).send({ message: "Content body missing" })

    const { email, password } = req.body;

    const existingUser = await User.findOne({ email })

    if (!existingUser) {
        return res.status(401).json({ message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
        return res.status(401).json({ message: "Invalid Credentials" });
    }

    const accessToken = generateToken(existingUser._id)
    const refreshToken = generateRefreshToken(existingUser._id);

    existingUser.refreshToken = refreshToken
    await existingUser.save()

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/'
    };

    const user = await User.findById(existingUser._id)
        .select("-password -refreshToken")
        .lean();

    res.cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json({
            message: "Login successful",
            token: accessToken,
            user
        })
}

export const refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) return res.sendStatus(401);

    const existingUser = await User.findOne({ refreshToken });

    if (!existingUser) return res.sendStatus(403);

    jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err) => {
        if (err) return res.sendStatus(403);

        const newAccessToken = generateToken(existingUser._id)

        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        });

        res.json({ message: "Token refreshed" })
    })
}

export const logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken


    const existingUser = await User.findOne({ refreshToken })

    if (existingUser) {
        existingUser.refreshToken = null;
        await existingUser.save()
    }

    res.clearCookie("accessToken")
    res.clearCookie("refreshToken")
    res.json({ message: "Logged out" })
}

export const verify = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-password -refreshToken")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      loggedIn: true,
      user
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
