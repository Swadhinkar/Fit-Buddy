// import mongoose from 'mongoose'

// const userSchema = new mongoose.Schema({
//     name: {
//         type : String,
//         required : true,
//         unique : false
//     },
//     profilePicture:{
//         type: String,
//         required: false,
//         unique: false
//    },
//     email: {
//         type : String,
//         required : true,
//         unique : true,
//         index: true
//     },
//     password: {
//         type : String,
//         required : true,
//         unique : false
//     },
//     age: {
//         type :Number, 
//         required : false,
//         unique : false
//     },
//     gender: {
//         type : String,
//         required : false,
//         unique : false
//     },
//     height: {
//         type: Number,
        
//         required: false,
//         unique: false
//     },
//     weight:{
//         type: Number,
//         required: false,
//         unique: false
//     },
//     refreshToken:{
//         type: String
//     }
// },{timestamps: true})

// const User = mongoose.model('User', userSchema)

// export default User

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // Explicitly declaring _id allows your optimized controller 
    // to pass manually pre-allocated ObjectIds cleanly during load tests
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true // Falls back to auto-generation if not provided manually
    },
    name: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true,
        unique: true, // Creates a unique constraint at the database layer
        index: true   // Changes verification scan speed from O(N) to O(1)
    },
    password: {
        type: String,
        required: true
    },
    age: {
        type: Number, 
        required: false
    },
    gender: {
        type: String,
        required: false
    },
    height: {
        type: Number,
        required: false
    },
    weight: {
        type: Number,
        required: false
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true });

// Prevents compilation errors if this model is compiled multiple times in development
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;