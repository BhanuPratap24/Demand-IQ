const mysql = require("mysql2");
const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "../.env")
});

function getPoolConfig() {
    const uri = process.env.DATABASE_URL || process.env.MYSQL_URI || process.env.MYSQL_URL;

    if (uri) {
        try {
            const parsedUrl = new URL(uri);
            const isLocal = parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1";
            const requiresSsl = !isLocal || parsedUrl.searchParams.get("ssl-mode") || parsedUrl.searchParams.get("ssl");

            const config = {
                host: parsedUrl.hostname,
                port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 3306,
                user: decodeURIComponent(parsedUrl.username || ""),
                password: decodeURIComponent(parsedUrl.password || ""),
                database: parsedUrl.pathname ? parsedUrl.pathname.replace(/^\//, "") : undefined,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                enableKeepAlive: true,
                keepAliveInitialDelay: 10000
            };

            if (requiresSsl) {
                config.ssl = {
                    rejectUnauthorized: false
                };
            }

            return config;
        } catch (err) {
            console.warn("Could not parse database URI, using raw URL:", err.message);
            return uri;
        }
    }

    const host = process.env.DB_HOST || "localhost";
    const isLocal = host === "localhost" || host === "127.0.0.1";
    const requiresSsl = process.env.DB_SSL === "true" || (!isLocal && process.env.DB_SSL !== "false");

    const config = {
        host: host,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "demandiq",
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000
    };

    if (requiresSsl) {
        config.ssl = {
            rejectUnauthorized: false
        };
    }

    return config;
}

const pool = mysql.createPool(getPoolConfig());

module.exports = pool.promise();

