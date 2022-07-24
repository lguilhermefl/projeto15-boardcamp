import joi from 'joi';

const gamesSchema = joi.object({
    name: joi
        .string()
        .required(),
    image: joi
        .string()
        .uri()
        .required(),
    stockTotal: joi
        .number()
        .greater(0)
        .required(),
    categoryId: joi
        .number()
        .greater(0)
        .required(),
    pricePerDay: joi
        .number()
        .greater(0)
        .required()
});

export default gamesSchema;