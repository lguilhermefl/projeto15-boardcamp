import express from 'express';

import connection from './database/database.js';

import categorySchema from './schemas/categorySchema.js';
import gamesSchema from './schemas/gamesSchema.js';

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

            const { rows: gamesThatStartsWithName } = await connection.query(`
                select g.*, c.name as "categoryName"
                from games g
                join categories c
                on c.id=g."categoryId"
                where g.name
                like $1
            `, [`${stringToSearch}%`]);

            return res.send(gamesThatStartsWithName);
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


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log('Server is listening on port 4000.');
});