import app from "./app";

// Puerto dinámico proporcionado por Render o un valor predeterminado
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
