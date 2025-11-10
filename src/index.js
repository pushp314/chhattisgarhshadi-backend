import { httpServer } from "./app.js";
import { config } from "./config/config.js";
import { logger } from "./config/logger.js";

const PORT = config.PORT || 3000;

httpServer.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
