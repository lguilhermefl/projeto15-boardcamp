import joi from 'joi';

const rentalsSchema = joi.object({
    customerId: joi
        .number()
        .greater(0)
        .required(),
    gameId: joi
        .number()
        .greater(0)
        .required(),
    daysRented: joi
        .number()
        .greater(0)
        .required()
});

export default rentalsSchema;