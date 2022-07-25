import connection from "../database/database.js";

const getQueryOrderByAndDesc = async (defaultQueryString, orderBy, desc) => {

    if (orderBy && desc === 'true') {
        const queryString = `
                ${defaultQueryString}
                order by ${orderBy}
                desc
            `;
        const { rows: query } = await connection.query(queryString);

        return query;
    };

    if (orderBy) {
        const queryString = `
                ${defaultQueryString}
                order by ${orderBy}
            `;
        const { rows: query } = await connection.query(queryString);

        return query;
    };
}

export default getQueryOrderByAndDesc;