const { createApp } = require('./app');
const { ensureSeeded } = require('./ensureSeed');
const config = require('./config');

const { PORT } = config;

ensureSeeded()
  .then(() => {
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
