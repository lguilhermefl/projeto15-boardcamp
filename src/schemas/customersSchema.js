import joi from 'joi';

const customersSchema = joi.object({
    name: joi
        .string()
        .required(),
    phone: joi
        .string()
        .min(10)
        .max(11)
        .pattern(/^[0-9]+$/)
        .required(),
    cpf: joi
        .string()
        .length(11)
        .pattern(/^[0-9]+$/)
        .required(),
    birthday: joi
        .string()
        .length(10)
        .pattern(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
        .required()
});

export default customersSchema;