import express from 'express';
import dayjs from 'dayjs';
import cors from 'cors';

import connection from './database/database.js';

import categorySchema from './schemas/categorySchema.js';
import gamesSchema from './schemas/gamesSchema.js';
import customersSchema from './schemas/customersSchema.js';
import rentalsSchema from './schemas/rentalsSchema.js';
import getQueryOffsetAndLimit from './utils/getQueryOffsetAndLimit.js'

const app = express();
app.use(express.json());
app.use(cors());

const capitalizeString = string => {
    const str = string.toLowerCase();
    return str[0].toUpperCase() + str.slice(1);
};

app.get('/categories', async (req, res) => {
    try {
        const { offset, limit } = req.query;

        const defaultQueryString = `
            select * from categories
        `;

        const query = await getQueryOffsetAndLimit(defaultQueryString, offset, limit);

        if (query) {
            return res.send(query);
        };

        const { rows: categories } = await connection.query(defaultQueryString);

        res.send(categories);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.post('/categories', async (req, res) => {
    try {
        const { name: newCategorie } = req.body;

        const validation = categorySchema.validate(req.body);

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
        const { name, offset, limit } = req.query;

        const defaultQueryString = `
            select g.*, c.name as "categoryName"
            from games g
            join categories c
            on c.id=g."categoryId"
        `;

        const query = await getQueryOffsetAndLimit(defaultQueryString, offset, limit);

        if (query) {
            return res.send(query);
        };

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

        const { rows: games } = await connection.query(defaultQueryString);

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
        const { cpf, offset, limit } = req.query;

        const defaultQueryString = `
            select *
            from customers
        `;

        const query = await getQueryOffsetAndLimit(defaultQueryString, offset, limit);

        if (query) {
            return res.send(query);
        };

        if (cpf) {

            const { rows: customersThatStartWithCpf } = await connection.query(`
                select *
                from customers c
                where c.cpf
                like $1
            `, [`${cpf}%`]);

            return res.send(customersThatStartWithCpf);
        };

        const { rows: customers } = await connection.query(defaultQueryString);

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

        res.send(customersWithId[0]);

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

app.get('/rentals', async (req, res) => {
    try {
        const { customerId, gameId, offset, limit } = req.query;

        const defaultQueryString = `
            select r.*,
                json_build_object('id', c.id, 'name', c.name) as customer,
                json_build_object('id', g.id, 'name', g.name, 'categoryId', g."categoryId", 'categoryName', cat.name) as game
            from rentals r 
            join customers c 
            on r."customerId"=c.id
            join games g
            on r."gameId"=g.id
            join categories cat
            on g."categoryId"=cat.id
        `;

        const query = await getQueryOffsetAndLimit(defaultQueryString, offset, limit);

        if (query) {
            return res.send(query);
        };

        if (customerId) {

            const { rows: rentalsForCustomerId } = await connection.query(`
                select r.*,
                    json_build_object('id', c.id, 'name', c.name) as customer,
                    json_build_object('id', g.id, 'name', g.name, 'categoryId', g."categoryId", 'categoryName', cat.name) as game
                from rentals r 
                join customers c 
                on c.id=$1 and r."customerId"=c.id
                join games g
                on r."gameId"=g.id
                join categories cat
                on g."categoryId"=cat.id
            `, [customerId]);

            return res.send(rentalsForCustomerId);
        };

        if (gameId) {

            const { rows: rentalsForGameId } = await connection.query(`
                select r.*,
                    json_build_object('id', c.id, 'name', c.name) as customer,
                    json_build_object('id', g.id, 'name', g.name, 'categoryId', g."categoryId", 'categoryName', cat.name) as game
                from rentals r 
                join customers c 
                on r."customerId"=c.id
                join games g
                on g.id=$1 and r."gameId"=g.id
                join categories cat
                on g."categoryId"=cat.id
            `, [gameId]);

            return res.send(rentalsForGameId);
        };

        const { rows: rentals } = await connection.query(defaultQueryString);

        res.send(rentals);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.post('/rentals', async (req, res) => {
    try {
        const newRental = req.body;
        const { customerId, gameId, daysRented } = newRental;
        const date = Date.now();
        const rentDate = dayjs(date).format('YYYY-MM-DD');

        const validation = rentalsSchema.validate(newRental);

        if (validation.error) {
            return res.sendStatus(400);
        };

        const { rows: existCustomerAndGame } = await connection.query(`
            select c.id, g.id
            from customers c, games g
            where c.id=$1 and g.id=$2
        `, [customerId, gameId]);

        if (existCustomerAndGame.length === 0) {
            return res.sendStatus(400);
        };

        const { rows: gameRentedInfo } = await connection.query(`
            select "pricePerDay",
                "stockTotal"
            from games g
            where g.id=$1
        `, [gameId]);

        const pricePerDay = gameRentedInfo[0].pricePerDay;
        const stockTotal = gameRentedInfo[0].stockTotal;
        const originalPrice = pricePerDay * daysRented;
        const returnDate = null;
        const delayFee = null;

        const { rows: totalGamesRented } = await connection.query(`
            select *
            from rentals r
            where r."gameId"=$1 AND r."returnDate" is null
        `, [gameId]);

        if (totalGamesRented.length >= stockTotal) {
            return res.sendStatus(400);
        };

        await connection.query(`
            insert into rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee")
            values ($1, $2, $3, $4, $5, $6, $7)
        `, [customerId, gameId, rentDate, daysRented, returnDate, originalPrice, delayFee]);

        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.post('/rentals/:id/return', async (req, res) => {
    try {
        const { id } = req.params;
        const date = Date.now();
        const returnDate = dayjs(date).format('YYYY-MM-DD');

        const { rows: rental } = await connection.query(`
            select *
            from rentals r
            where r.id=$1
        `, [id]);

        if (rental.length === 0) {
            return res.sendStatus(404);
        };

        const isRentalReturned = rental[0].returnDate;

        if (isRentalReturned) {
            return res.sendStatus(400);
        };

        const daysRented = rental[0].daysRented;
        const originalPrice = rental[0].originalPrice;
        const rentDate = rental[0].rentDate;

        const pricePerDay = originalPrice / daysRented;
        const delayDays = dayjs(date).diff(rentDate, 'days');
        let delayFee = 0;

        if (delayDays > daysRented) {
            delayFee = (delayDays - daysRented) * pricePerDay;
        };

        await connection.query(`
            update rentals
            set "returnDate"=$1,
                "delayFee"=$2
            where id=$3
        `, [returnDate, delayFee, id]);

        res.sendStatus(200);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.delete('/rentals/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { rows: rental } = await connection.query(`
            select *
            from rentals r
            where r.id=$1
        `, [id]);

        if (rental.length === 0) {
            return res.sendStatus(404);
        };

        const isRentalReturned = rental[0].returnDate;

        if (!isRentalReturned) {
            return res.sendStatus(400);
        };

        await connection.query(`
            delete from rentals
            where id=$1
        `, [id]);

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