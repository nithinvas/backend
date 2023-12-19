const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
var cors = require('cors');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());



app.use(cors({origin: true, credentials: true}));

// Use your authentication routes
app.use('/auth', authRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

