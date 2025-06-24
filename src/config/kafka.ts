import { Consumer, Kafka } from "kafkajs";
import { MessageBroker } from "../types/broker";

export class KafkaBroker implements MessageBroker{
    private consumer: Consumer;
    constructor(clientId: string, brokers: string[]) { 
        const kafka = new Kafka({
            clientId,
            brokers
        })
        this.consumer = kafka.consumer({ groupId: clientId });
    }
    
    async connectConsumer() {
        await this.consumer.connect();
    }

    async disconnectConsumer() {
        if (this.consumer) {
            await this.consumer.disconnect();
        }
    }

    async consumeMessage(topics: string[], fromBeginning: boolean = false) {

        await this.consumer.subscribe({
            topics,
            fromBeginning
        })
        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                 console.log({
                   value: message.value.toString(),
                 });
                console.log("topic:", topic);
                console.log("partition:", partition);
            }
        })
    }
}