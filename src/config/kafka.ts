import { Consumer, EachMessagePayload, Kafka, KafkaConfig, Producer } from "kafkajs";
import config from "config";
import { MessageBroker } from "../types/broker";
import { handleProductUpdate } from "../productCache/productCacheHandler";
import { handleToppingUpdate } from "../toppingCache/toppingCacheHandler";

export class KafkaBroker implements MessageBroker {
  private consumer: Consumer;
  private producer: Producer;
  constructor(clientId: string, brokers: string[]) {

      let kafkaConfig: KafkaConfig = {
        clientId,
        brokers,
      };

      if (process.env.NODE_ENV === "production") {
        kafkaConfig = {
          ...kafkaConfig,
          ssl: true, // Enable SSL for production
          connectionTimeout: 45000, // 45 seconds
          sasl: {
            mechanism: "plain",
            username: config.get("kafka.sasl.username"),
            password: config.get("kafka.sasl.password"),
          },
        };
    }
    
    const kafka = new Kafka(kafkaConfig);
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
    async sendMessage(topic: string, message: string, key: string) {
        if (!this.producer) {
            throw new Error("Producer is not connected");
        }

        try {
          const data:{key?:string; value:string} = {
            value: message,
          }
          if(key){
            data.key = key
          }
            await this.producer.send({
                topic,
                messages: [data],
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
