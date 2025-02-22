const express = require('express');
const router = express.Router();
const User = require('./user.model');
const generateToken = require('../middleware/generateToken');

// Register endpoints
router.post('/register', async (req, res) => {
    try {
        const {username, email, password} = req.body;
        const user = new User({username, email, password});
        await user.save();
        res.status(201).send({message: 'User Registered Successfully...!'});
        
    } catch (error) {
        console.error("Error while registering user", error);
        res.status(500).send({message: 'Error while registering user'});
        
    }
})

// Login user endpoints

router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if(!user) {
            return res.status(404).send({message: 'User not found'});
        }
        const isMatch = await user.comparePassword(password);
        if(!isMatch) {
            return res.status(401).send({message: 'Invalid Password'});
        }
        const token = await generateToken(user._id);
        res.cookie('token', token, {
            httpOnly: true, 
            secure: true, 
            sameSite: 'None'
        });
        res.send({message: 'User Logged In Successfully...!',token, user: {
            _id: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
            profileImage: user.profileImage,
            bio: user.bio,
            profession: user.profession
        }});

    } catch (error) {
        console.error("Error while logging in user", error);
        res.status(500).send({message: 'Error while logging in user'});
    }   
})


// logout endpoint 

router.post('/logout', async (req, res) => {
    try {
        res.clearCookie('token');
        res.send({message: 'User Logged Out Successfully...!'});
    } catch (error) {
        console.error("Error while logging out user", error);
        res.status(500).send({message: 'Error while logging out user'});
    }
})

// Delete user  
router.delete('/users/:id', async(req, res)=>{
    try {
        const {id} = req.params;
        const user = await User.findByIdAndDelete(id);
        if(!user) {
            return res.status(404).send({message: 'User not found'});
        }
        res.status(200).send({message: 'User Deleted Successfully...!'});
    } catch (error) {
        console.error("Error Deleting user", error);
        res.status(500).send({message: 'Error Deleting user'});
    }}
)

// get all users

router.get('/users', async(req, res)=>{
    try {
        const users = await User.find({}, 'id email role').sort({createdAt: -1});
        res.status(200).send(users);
    } catch (error) {
        console.error("Error while getting users", error);
        res.status(500).send({message: 'Error while getting users'});
    }
})


// update user role 

router.put('/users/:id', async(req, res)=>{
    try {
        const {id} = req.params;
        const {role} = req.body;
        const user = await User.findByIdAndUpdate(id, {role}, {new: true});
        if(!user) {
            return res.status(404).send({message: 'User not found'});
        }
        res.status(200).send({message: 'User role updated successfully...!', user});
    } catch (error) {
        console.error("Error while updating user role", error);
        res.status(500).send({message: 'Error while updating user role'});
    }
})

// update user profile
router.patch('/edit-profile', async(req, res)=>{
    try {
        const {userId, username, profileImage, bio, profession} = req.body;
        if(!userId) {
            return res.status(400).send({message: 'User Id is required'});
        }
        const user = await User.findById(userId);

        if(!user) {
            return res.status(404).send({message: 'User not found'});
        }

        // update profile
        if(username !== undefined) user.username = username;
        if(profileImage !== undefined) user.profileImage = profileImage;
        if(bio !== undefined) user.bio = bio;
        if(profession !== undefined) user.profession = profession;
        await user.save();


        res.status(200).send({
            message: 'User profile updated successfully...!',
            user:{
            _id: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
            profileImage: user.profileImage,
            bio: user.bio,
            profession: user.profession
        }});

    } catch (error) {
        console.error("Error while updating user profile", error);
        res.status(500).send({message: 'Error while updating user profile'});
    }
})


module.exports = router;