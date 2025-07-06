import { Consumer, EachMessagePayload, Kafka, Producer } from "kafkajs";
import { MessageBroker } from "../types/broker";
import { handleProductUpdate } from "../productCache/productCacheHandler";
import { handleToppingUpdate } from "../toppingCache/toppingCacheHandler";

export class KafkaBroker implements MessageBroker {
  private consumer: Consumer;
  private producer: Producer;
  constructor(clientId: string, brokers: string[]) {
    const kafka = new Kafka({
      clientId,
      brokers,
    });
    this.producer = kafka.producer();
    this.consumer = kafka.consumer({ groupId: clientId });
  }

  async connectProducer() {
    if(this.producer){
      await this.producer.connect();
    }
  }

  async connectConsumer() {
    await this.consumer.connect();
  }

  async disconnectProducer() {
    if (this.producer) {
      await this.producer.disconnect();
    }
  }

  async disconnectConsumer() {
    if (this.consumer) {
      await this.consumer.disconnect();
    }
  }

    /**
     * @param topic - The Kafka topic to which the message will be sent.
     * @param message - The message to be sent to the Kafka topic.
     * @throws {Error} - When the producer is not connected
     */
    async sendMessage(topic: string, message: string) {
        if (!this.producer) {
            throw new Error("Producer is not connected");
        }

        try {
            await this.producer.send({
                topic,
                messages: [
                    { value: message },
                ],
            });
        } catch (error) {
            console.error("Error sending message to Kafka:", error);
            throw error;
        }
    }

  async consumeMessage(topics: string[], fromBeginning: boolean = false) {
    await this.consumer.subscribe({
      topics,
      fromBeginning,
    });
    await this.consumer.run({
      eachMessage: async ({
        topic,
        partition,
        message,
      }: EachMessagePayload) => {
            console.log({ value: message.value.toString(), topic, partition, });

        switch (topic) {
          case "product":
            await handleProductUpdate(message.value?.toString());
                return;
            
            case "topping":
                await handleToppingUpdate(message.value?.toString());
                return;
        }
      },
    });
  }
}
