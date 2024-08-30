const app = require('./app');
require('dotenv').config();
const fs = require('fs')
console.log(fs.readdirSync('./public/images/adverts/advert-1'));
const path = require('path');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(express.static(path.join(__dirname, "..", "dist")));
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});