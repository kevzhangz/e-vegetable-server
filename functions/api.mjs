import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'

// Routes
import authRoutes from '../src/routes/auth.routes.js'
import userRoutes from '../src/routes/user.routes.js'
import verifyRoutes from '../src/routes/verify.routes.js'
import storeRoutes from '../src/routes/store.routes.js'
import categoryRoutes from '../src/routes/category.routes.js'
import productRoutes from '../src/routes/product.routes.js'
import cartRoutes from '../src/routes/cart.routes.js'
import orderRoutes from '../src/routes/order.routes.js'

// setup process.env
import dotenv from 'dotenv'
dotenv.config();

import serverless from 'serverless-http'

const app = express();
const port = process.env.PORT || 8000;

const router = express.Router();

mongoose
  .connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(`Database connected successfully`))
  .catch((err) => console.log(err));

mongoose.Promise = global.Promise;

router.get("/", (req, res) => {
  res.json({
    hello: "hi"
  })
})

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(bodyParser.json({limit: "20mb"}));
app.use(cors())

app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', storeRoutes);
app.use('/', categoryRoutes);
app.use('/', productRoutes);
app.use('/', cartRoutes);
app.use('/', orderRoutes);
app.use('/', verifyRoutes);
app.use('/', router);

app.listen(port, () => {
  console.log(`Server running on port http://127.0.0.1:${port}`);
});

export default app
export const handler = serverless(app);