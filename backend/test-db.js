const pool = require("./config/db");

async function testDatabase() {
    try {
        const connection = await pool.getConnection();

        console.log("===================================");
        console.log("   DEMANDIQ MYSQL CONNECTION");
        console.log("===================================");
        console.log("MySQL Connected Successfully!");

        const [rows] = await connection.query("SELECT DATABASE() AS database_name");

        console.log("Database:", rows[0].database_name);

        connection.release();

        process.exit(0);

    } catch (error) {

        console.error("MySQL Connection Failed!");
        console.error(error.message);

        process.exit(1);
    }
}

testDatabase();