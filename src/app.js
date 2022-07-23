import express from 'express';

import connection from './database/database.js';

import categorySchema from './schemas/categorySchema.js';

const app = express();
app.use(express.json());

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

        if (categoryExists !== 0) {
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

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log('Server is listening on port 4000.');
});