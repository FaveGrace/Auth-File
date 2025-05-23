const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');// this allows us to create a file called .env, allowing us store sensitive information like password, bvn, etc. which is not pushed to github but to the cloud.
const bcrypt = require('bcryptjs');// this is used to hash the password before saving it to the database
const jwt = require("jsonwebtoken")
const Auth = require('./authModel');
const {sendVerificationMail, sendForgotPasswordMail, validEmail} = require('./sendMail');
dotenv.config();// this loads the environment variables from the .env file into process.env

const app = express();

app.use(express.json());// this allows us to parse the json data sent in the request body

const PORT = process.env.PORT || 8000;

mongoose.connect(process.env.MONGODB_URL)
.then(() => {
        console.log('Connected to MongoDB');

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })
})

app.post("/auth/signup", async (req, res) => {
    
    //try{
        const { email, password, firstName, lastName, state } = req.body;
    if(!email){
        return res.status(400).json({ message: "Email is required" });
    }
    if(!validEmail(email)){
        return res.status(400).json({ message: "Invalid email address" });
    }
    if(!password){
        return res.status(400).json({ message: "Password is required" });
    }

    const existingUser = await Auth.findOne({email})

    if(existingUser){
        return res.status(400).json({ message: "User already exists" });
    }

    if(password.length < 6){
        return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);// this hashes the password using bcryptjs with a salt of 10 rounds

    const newUser = new Auth({ 
        email, 
        password: hashedPassword, 
        firstName, 
        lastName, 
        state });

    await newUser.save();

    //send user an email
    const accessToken = await jwt.sign(
        {id: newUser._id, email: newUser.email},
        `${process.env.ACCESS_TOKEN}`,
        {expiresIn: "5m"}
    )

    await sendVerificationMail(email, accessToken)
    

    res.status(201).json({ 
        message: "User created successfully", 
        newUser: { email, firstName, lastName, state}
    });

    // }catch(error){
    //      res.status(500).json({ error });
    // }
})

app.post("/auth/login", async (req, res) => {
    try{
        const {email, password} = req.body;

        const user = await Auth.findOne({email})
        //.select("-password")

        if(!user){
            return res.status(404).json({message: "User account does not exist!"})
        }

        const isMatch = await bcrypt.compare(password, user?.password)//? optional chaining, if there is no password, it will not throw an error

        if(!isMatch){
            return res.status(400).json({message: "Incorrect email or password."})
        }

        //Generate a token
        const accessToken = jwt.sign( 
            {id: user?._id},
            process.env.ACCESS_TOKEN,
            {expiresIn: "5m"}
        )

        const refreshToken = jwt.sign(
            {id: user?._id},
            process.env.REFRESH_TOKEN,
            {expiresIn: "30d"}
        )

        res.status(200).json({
            message: "Login successful",
            accessToken,
            user:{
                email: user?.email,
                firstName: user?.firstName,
                lastName: user?.lastName,
                state: user?.state
            },
            refreshToken
        })
    }catch(error){
         res.status(500).json({ message: "Internal server error" });
    }
})    

app.post("/forgot-password", async (req, res) => {
    const {email} = req.body
    const user = await Auth.findOne({email})
    if(!user){
        return res.status(404).json({message: "User account does not exist!"})
    }

    //send the user an email with the token to reset the password
    const accessToken = await jwt.sign(
        {user},
        `${process.env.ACCESS_TOKEN}`,
        {expiresIn: "5m"}
    )

    await sendForgotPasswordMail(email, accessToken)

    res.status(200).json({message: "Please check your email, we have sent you the request to reset your password."})
})

app.patch("/reset-password", async (req, res) => {
    const {email, password} = req.body
    const user = await Auth.findOne({email})
    if(!user){
        return res.status(404).json({message: "User account does not exist!"})
    }
    if(password.length < 12){
        return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const hashedPassword = await bcrypt.hash(password, 12);// this hashes the password using bcryptjs with a salt of 10 rounds
    user.password = hashedPassword
    await user.save()
    res.status(200).json({message: "Password reset successfully"})
})