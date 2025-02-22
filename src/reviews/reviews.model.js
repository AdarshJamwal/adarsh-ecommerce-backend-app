const {Schema, model} = require('mongoose');

const ReviewSchema = new Schema({
   comment:{type:String, required:true},
   rating:{type:Number, required:true},
   userId:{type:Schema.Types.ObjectId, ref:"User", required:true},
   productId:{type:Schema.Types.ObjectId, ref:"Product", required:true},
}, {timestamps:true})

const Reviews = model("Review", ReviewSchema);
module.exports = Reviews;