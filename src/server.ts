
import config from "config";
import connectDB from "./config/db";
import app from "./app";
import logger from "./config/logger";
import { createMessageBroker } from "./common/factories/brokerFactory";
import { MessageBroker } from "./types/broker";

const startServer = async () => {
  const PORT = config.get("server.port") || 5503;
  let messageBroker: MessageBroker | null;
  
  try {
    await connectDB();
    messageBroker = createMessageBroker();
    await messageBroker.connectConsumer();
    await messageBroker.consumeMessage(config.get("kafka.topics"), false);

    app
      .listen(PORT, () => console.log(`Listening on port ${PORT}`))
      .on("error", (err) => {
        console.log("err", err.message);
        process.exit(1);
      });
    
  } catch (err) {
    logger.error("Error happened: ", err.message);
    await messageBroker.disconnectConsumer();
    process.exit(1);
  }
};

void startServer();
