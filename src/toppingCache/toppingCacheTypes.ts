export interface ToppingCache {
    toppingId: string;
    price: number;
}

export enum ToppingEvents {
  TOPPING_CREATE = "TOPPING_CREATE",
  TOPPING_UPDATE = "TOPPING_UPDATE",
  TOPPING_DELETE = "TOPPING_DELETE",
}

export interface ToppingMessage {
    event: ToppingEvents;
    data: {
        id: string;
        price: number;
    }
}