const exp = require("express");
const app = exp();

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");

const userApp = require("./APIs/userApi");
const geminiApp = require("./APIs/geminiApi")

const cors = require("cors");
app.use(cors());
app.set("trust proxy", true);

const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send("Nihesh Seller Portal API is running");
});

//db connect
mongoose
  .connect(process.env.DBURL)
  .then(() => {
    app.listen(port, "0.0.0.0", () =>
      console.log(`Server listening on port : ${port}`)
    );
    console.log("DB Connection Success");
  })
  .catch((err) => console.log("Error in DB Connection : ", err));

app.use(exp.json());
app.use(exp.urlencoded({ extended: true, limit: "10mb" }));

app.use("/user", userApp);
app.use("/gemini", geminiApp)

// 52b8edc46c0f5ba747022e30c67e18b25dc6aa383444c4202e34ca42b9542b72
// Add this right after your cors middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});


//error handler
app.use((err, req, res, next)=>{
  console.log("Error object in express error handler : ", err);
  res.send({message:err.message})
})