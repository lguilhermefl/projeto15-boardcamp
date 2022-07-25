import connection from "../database/database.js";

const getQueryOffsetAndLimit = async (defaultQueryString, offset, limit) => {

    if (offset && limit) {
        const queryString = `
                ${defaultQueryString}
                offset $1
                limit $2
            `;
        const { rows: query } = await connection.query(queryString, [offset, limit]);

        return query;
    };

    if (offset) {
        const queryString = `
                ${defaultQueryString}
                offset $1
            `;
        const { rows: query } = await connection.query(queryString, [offset]);

        return query;
    };

    if (limit) {
        const queryString = `
                ${defaultQueryString}
                limit $1
            `;
        const { rows: query } = await connection.query(queryString, [limit]);

        return query;
    };
}

export default getQueryOffsetAndLimit;