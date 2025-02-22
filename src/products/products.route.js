const express = require("express");
const mongoose = require("mongoose");
const Products = require("./products.model");
const Reviews = require("../reviews/reviews.model");
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");
const router = express.Router();

//post a product

router.post("/create-product", async (req, res) => {
  try {
    const newProduct = new Products({
      ...req.body,
    });
    const savedProduct = await newProduct.save();
    
    // calculate reviews
    const reviews = await Reviews.find({ productId: savedProduct._id });
    if (reviews.length > 0) {
      const totalRating = reviews.reduce(
        (acc, review) => acc + review.rating,
        0
      );
      const averageRating = totalRating / reviews.length;
      savedProduct.rating = averageRating;
      await savedProduct.save();
    }
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Failed to create product", error);
    res.status(500).json({ message: "Failed to create a product" });
    
  }
});


// get all products

router.get("/", async (req, res) => {
    try {
        const {category, color, minPrice, maxPrice, page=1, limit=10}  = req.query;

        let filter = {};
        if(category && category !== "all") {
            filter.category = category;
        }
        if(color && color !== "all") {
            filter.color = color;
        }
        if(minPrice && maxPrice) {
            const min = parseFloat(minPrice);
            const max = parseFloat(maxPrice);
            if(!isNaN(min) && !isNaN(max)) {
                filter.price = {$gte: min, $lte: max};
            }
        }
        const skip = (parseInt(page)-1) * parseInt(limit);
        const totalProducts = await Products.countDocuments(filter);

        const totalPages = Math.ceil(totalProducts / parseInt(limit));
        const products = await Products.find(filter)
                        .skip(skip)
                        .limit(parseInt(limit))
                        .populate("author", "email")
                        .sort({createdAt: -1});
        res.status(200).json({products, totalPages, totalProducts});




    } catch (error) {
        console.error("Failed to create product", error);
        res.status(500).json({ message: "Failed to create a product" });
    }
});

// get single product

router.get("/:id", async(req, res) => {
    try {
        const productId = req.params.id;

         // Validate if productId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }
        
        const product = await Products.findById(productId).populate("author", "email username");
        if(!product) {
            return res.status(404).json({message: "Product not found"});
        }
        const reviews = await Reviews.find({productId}).populate("userId", " username email");
        res.status(200).json({product, reviews});
    } catch (error) {
        console.error("Error fetching product ", error);
        res.status(500).json({ message: "Failed to fetch the product" });
    }
});


// Update a product 

router.patch("/update-product/:id", verifyToken, verifyAdmin, async(req, res)=>{
    try {
        const productId = req.params.id;
        
        const updatedProduct = await Products.findByIdAndUpdate(
            productId,
            {
                ...req.body
            },
            {new: true}
        )
        if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).send({
            message: "Product updated successfully",
            product: updatedProduct,
        })

    } catch (error) {
        console.error("Failed to Update the Product", error);
        res.status(500).json({ message: "Failed Update the product" });
    }
});



// delete a product 

router.delete("/:id", async(req, res)=>{
    try {
        const productId = req.params.id;
         // Validate if productId is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({ message: "Invalid product ID" });
            }
        const deletedProduct = await Products.findByIdAndDelete(productId);
        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }
        // delete reviews related to the product

        await Reviews.deleteMany({productId:productId});

        res.status(200).send({
            message: "Product deleted successfully",
            product: deletedProduct,
        })
    } catch (error) {
        console.error("Failed to delete the product", error);
        res.status(500).send({message:"Failed to delete the product"});
        
    }
})


//get related products 
router.get("/related/:id", async(req, res)=>{
    try {
        const {id} = req.params;
        if(!id) {
            return res.status(400).send({message:"Product id is required"});
        }
        const product = await Products.findById(id);

         // Validate if productId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        if(!product) {
            return res.status(404).send({message:"Product not found"});
        }
        const titleRegex = new RegExp(
            product.name
            .split(" ")
            .filter((word)=>word.length >1)
            .join("|"), "i");

            const relatedProducts = await Products.find({
                _id: {$ne: id}, // exclude the current product
                $or:[
                    {name: {$regex: titleRegex}},   // match the similiar title
                    {category: product.category},   // match the same category
                ]
            })
            res.status(200).send(relatedProducts);

    } catch (error) {
        console.error("Failed to fetch related products", error);
        res.status(500).send({message:"Failed to fetch related products"});
        
    }
})


module.exports = router;
