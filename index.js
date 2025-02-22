const express = require('express')
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
require('dotenv').config();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const port = process.env.PORT || 5000;

// Middlewares setup
app.use(express.json({limit: '60mb'}));
app.use(express.urlencoded({limit: '60mb'}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// image upload 

const uploadImage = require("./src/utils/uploadImage")
// All Routes
const authRoutes = require('./src/users/user.route');
const productRoutes = require('./src/products/products.route');
const reviewRoutes = require("./src/reviews/reviews.router");
const orderRoutes = require("./src/orders/orders.route");
const statsRoutes = require("./src/stats/stats.route");



app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);



main()
.then(()=>console.log("MongoDB Connected Successfully..."))
.catch(err => console.log(err));

async function main(){
    await mongoose.connect(process.env.DB_URL)
    
    app.get('/', (req, res) => {
        res.send('App is running successfully...!')
      })
}

app.post("/uploadImage", async (req, res) => {
  try {
    const imageUrl = await uploadImage(req.body.image);
    res.send(imageUrl);
  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    res.status(500).send({ message: err.message || "Image upload failed" });
  }
});


app.listen(port, () => {
  console.log(`Ecommerce app listening on port ${port}`)
})



