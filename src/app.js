import express from 'express';

import connection from './database/database.js';

import categorySchema from './schemas/categorySchema.js';
import gamesSchema from './schemas/gamesSchema.js';
import customersSchema from './schemas/customersSchema.js';

const app = express();
app.use(express.json());

const capitalizeString = string => {
    const str = string.toLowerCase();
    return str[0].toUpperCase() + str.slice(1);
};

app.get('/categories', async (req, res) => {
    try {
        const { rows: categories } = await connection.query(`
            select * from categories
        `);

        res.send(categories);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.post('/categories', async (req, res) => {
    try {
        const { name: newCategorie } = req.body;

        const validation = categorySchema.validate(newCategorie);

        if (validation.error) {
            return res.sendStatus(400);
        };

        const { rows: categoryExists } = await connection.query(`
            select name
            from categories
            where name=$1
        `, [newCategorie]);

        if (categoryExists.length !== 0) {
            return res.sendStatus(409);
        };

        await connection.query(`
            insert into categories (name)
            values ($1)
        `, [newCategorie]);

        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.get('/games', async (req, res) => {
    try {
        const { name } = req.query;

        if (name) {
            const stringToSearch = capitalizeString(name);

            const { rows: gamesThatStartWithName } = await connection.query(`
                select g.*, c.name as "categoryName"
                from games g
                join categories c
                on c.id=g."categoryId"
                where g.name
                like $1
            `, [`${stringToSearch}%`]);

            return res.send(gamesThatStartWithName);
        };

        const { rows: games } = await connection.query(`
            select g.*, c.name as "categoryName"
            from games g
            join categories c
            on c.id=g."categoryId"
        `);

        res.send(games);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.post('/games', async (req, res) => {
    try {
        const newGame = req.body;
        const { name, image, stockTotal, categoryId, pricePerDay } = newGame;

        const validation = gamesSchema.validate(newGame);

        if (validation.error) {
            return res.sendStatus(400);
        };

        const { rows: gameExists } = await connection.query(`
            select name
            from games
            where name=$1
        `, [name]);

        if (gameExists.length !== 0) {
            return res.sendStatus(409);
        };

        await connection.query(`
            insert into games (name, image, "stockTotal", "categoryId", "pricePerDay")
            values ($1, $2, $3, $4, $5)
        `, [name, image, stockTotal, categoryId, pricePerDay]);

        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.get('/customers', async (req, res) => {
    try {
        const { cpf } = req.query;

        if (cpf) {

            const { rows: customersThatStartWithCpf } = await connection.query(`
                select *
                from customers c
                where c.cpf
                like $1
            `, [`${cpf}%`]);

            return res.send(customersThatStartWithCpf);
        };

        const { rows: customers } = await connection.query(`
            select *
            from customers
        `);

        res.send(customers);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.get('/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { rows: customersWithId } = await connection.query(`
                select *
                from customers c
                where c.id=$1
            `, [id]);

        if (customersWithId.length === 0) {
            return res.sendStatus(404);
        };

        res.send(customersWithId);

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.post('/customers', async (req, res) => {
    try {
        const newCustomer = req.body;
        const { name, phone, cpf, birthday } = newCustomer;

        const validation = customersSchema.validate(newCustomer);

        if (validation.error) {
            return res.sendStatus(400);
        };

        const { rows: cpfExists } = await connection.query(`
            select cpf
            from customers
            where cpf=$1
        `, [cpf]);

        if (cpfExists.length !== 0) {
            return res.sendStatus(409);
        };

        await connection.query(`
            insert into customers (name, phone, cpf, birthday)
            values ($1, $2, $3, $4)
        `, [name, phone, cpf, birthday]);

        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.put('/customers/:id', async (req, res) => {
    try {
        const newCustomer = req.body;
        const { id } = req.params;
        const { name, phone, cpf, birthday } = newCustomer;

        const validation = customersSchema.validate(newCustomer);

        if (validation.error) {
            return res.sendStatus(400);
        };

        const { rows: cpfExists } = await connection.query(`
            select *
            from customers
            where cpf=$1
            and id<>$2
        `, [cpf, id]);

        if (cpfExists.length !== 0) {
            return res.sendStatus(409);
        };

        await connection.query(`
                update customers
                set
                    name=$1,
                    phone=$2,
                    cpf=$3,
                    birthday=$4
                where customers.id=$5
            `, [name, phone, cpf, birthday, id]);

        res.sendStatus(200);

    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log('Server is listening on port 4000.');
});