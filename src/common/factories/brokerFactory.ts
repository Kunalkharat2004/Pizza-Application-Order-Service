import config from "config";
import { KafkaBroker } from "../../config/kafka";
import { MessageBroker } from "../../types/broker";


let messageBroker: MessageBroker | null = null;

export const createMessageBroker = () => {
    if (!messageBroker) {
        messageBroker = new KafkaBroker(
            config.get("kafka.clientId") as string,
            config.get("kafka.brokers") as string[]
        )
    }
    return messageBroker;
}
