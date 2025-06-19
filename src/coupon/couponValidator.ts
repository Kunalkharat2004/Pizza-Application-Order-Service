import { checkSchema } from "express-validator";

export const couponValidator = checkSchema({
    title: {
        in: ["body"],
        isString: {
        errorMessage: "Name must be a string",
        },
        notEmpty: {
        errorMessage: "Name cannot be empty",
        },
    },
    code: {
        in: ["body"],
        isString: {
        errorMessage: "Code must be a string",
        },
        notEmpty: {
        errorMessage: "Code cannot be empty",
        },
        matches: {
        options: [/^[A-Z0-9]+$/],
        errorMessage: "Code must be alphanumeric and uppercase",
        },
    },
    discount: {
        in: ["body"],
        isNumeric: {
        errorMessage: "Discount must be a number",
        },
        toFloat: true,
        custom: {
        options: (value) => value > 0 && value <= 100,
        errorMessage: "Discount must be between 0 and 100",
        },
    },
    expirationDate: {
        in: ["body"],
        isISO8601: {
        errorMessage: "Expiration date must be a valid date",
        },
    },
})

// Sample data:
// {
//     title: "Summer Sale",
//     code: "SUMMER2023",
//     discount: 20,
//     expirationDate: "2025-12-31T23:59:59.999Z"
// }