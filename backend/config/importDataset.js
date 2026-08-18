const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const db = require("../config/db");

const CSV_PATH = path.resolve(__dirname, "DemandIQ_Dataset.csv"); // adjust path if the CSV lives elsewhere

function toBool(value) {
    return value === "1" || value.toLowerCase() === "true" ? 1 : 0;
}

async function readCsv() {
    const rows = [];
    const parser = fs.createReadStream(CSV_PATH).pipe(
        parse({ columns: true, skip_empty_lines: true })
    );
    for await (const row of parser) {
        rows.push(row);
    }
    return rows;
}

async function insertStores(rows) {
    const storesMap = new Map(); // store_id -> region
    for (const row of rows) {
        storesMap.set(row["Store ID"], row["Region"]);
    }

    const stores = [...storesMap.entries()];
    const placeholders = stores.map(() => "(?, ?)").join(", ");
    const values = stores.flat();

    await db.query(
        `INSERT INTO stores (store_id, region) VALUES ${placeholders}
         ON DUPLICATE KEY UPDATE region = VALUES(region)`,
        values
    );

    console.log(`Stores inserted: ${stores.length}`);
    return storesMap;
}

async function insertProducts(rows) {
    // product_id -> { category, priceSum, costSum, count }
    const productsMap = new Map();

    for (const row of rows) {
        const pid = row["Product ID"];
        const price = Number(row["Price"]);
        const cost = Number(row["Cost"]);

        if (!productsMap.has(pid)) {
            productsMap.set(pid, {
                category: row["Category"],
                priceSum: 0,
                costSum: 0,
                count: 0,
            });
        }
        const p = productsMap.get(pid);
        p.priceSum += price;
        p.costSum += cost;
        p.count += 1;
    }

    const products = [...productsMap.entries()].map(([pid, p]) => [
        pid,
        `Product ${pid} (${p.category})`,   // no real product names in the dataset — generated placeholder
        p.category,
        Number((p.priceSum / p.count).toFixed(2)),  // avg price
        Number((p.costSum / p.count).toFixed(2)),   // avg cost
    ]);

    const placeholders = products.map(() => "(?, ?, ?, ?, ?)").join(", ");
    const values = products.flat();

    await db.query(
        `INSERT INTO products (product_id, product_name, category, price, cost)
         VALUES ${placeholders}
         ON DUPLICATE KEY UPDATE
            category = VALUES(category),
            price = VALUES(price),
            cost = VALUES(cost)`,
        values
    );

    console.log(`Products inserted: ${products.length}`);
}

async function insertInventory(rows) {
    // (product_id, store_id) -> { lastDate, lastInventoryLevel, totalUnitsSold, dayCount }
    const invMap = new Map();

    for (const row of rows) {
        const key = `${row["Product ID"]}|${row["Store ID"]}`;
        const date = row["Date"];
        const invLevel = Number(row["Inventory Level"]);
        const unitsSold = Number(row["Units Sold"]);

        if (!invMap.has(key)) {
            invMap.set(key, {
                product_id: row["Product ID"],
                store_id: row["Store ID"],
                lastDate: date,
                lastInventoryLevel: invLevel,
                totalUnitsSold: 0,
                dayCount: 0,
            });
        }
        const entry = invMap.get(key);
        entry.totalUnitsSold += unitsSold;
        entry.dayCount += 1;

        // keep the inventory level from the most recent date
        if (date >= entry.lastDate) {
            entry.lastDate = date;
            entry.lastInventoryLevel = invLevel;
        }
    }

    const SAFETY_FACTOR = 1.5;
    const inventoryRows = [...invMap.values()].map((e) => {
        const avgDailyDemand = e.totalUnitsSold / e.dayCount;
        const minimumStock = Math.round(avgDailyDemand * SAFETY_FACTOR);
        return [e.product_id, e.store_id, e.lastInventoryLevel, minimumStock];
    });

    // Insert in batches (could be a few hundred store-product combos)
    const BATCH = 500;
    for (let i = 0; i < inventoryRows.length; i += BATCH) {
        const batch = inventoryRows.slice(i, i + BATCH);
        const placeholders = batch.map(() => "(?, ?, ?, ?)").join(", ");
        const values = batch.flat();

        await db.query(
            `INSERT INTO inventory (product_id, store_id, current_stock, minimum_stock)
             VALUES ${placeholders}
             ON DUPLICATE KEY UPDATE
                current_stock = VALUES(current_stock),
                minimum_stock = VALUES(minimum_stock)`,
            values
        );
    }

    console.log(`Inventory rows inserted: ${inventoryRows.length}`);
}

async function insertSales(rows) {
    const columns = [
        "product_id", "store_id", "sale_date", "units_sold", "selling_price",
        "discount", "competitor_pricing", "weather_condition", "seasonality",
        "holiday_promotion", "revenue", "profit",
    ];

    const BATCH = 500;
    let total = 0;

    for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);

        const placeholders = batch.map(() => `(${columns.map(() => "?").join(", ")})`).join(", ");
        const values = batch.flatMap((row) => [
            row["Product ID"],
            row["Store ID"],
            row["Date"],
            Number(row["Units Sold"]),
            Number(row["Price"]),
            Number(row["Discount"]),
            Number(row["Competitor Pricing"]),
            row["Weather Condition"],
            row["Seasonality"],
            toBool(row["Holiday/Promotion"]),
            Number(row["Revenue"]),
            Number(row["Profit"]),
        ]);

        await db.query(
            `INSERT INTO sales (${columns.join(", ")}) VALUES ${placeholders}`,
            values
        );

        total += batch.length;
        console.log(`Sales inserted: ${total}`);
    }
}

async function main() {
    console.log("Reading CSV:", CSV_PATH);
    const rows = await readCsv();
    console.log(`Loaded ${rows.length} rows from CSV.`);

    // Order matters — stores/products first (foreign key parents),
    // then inventory/sales which reference them.
    await insertStores(rows);
    await insertProducts(rows);
    await insertInventory(rows);
    await insertSales(rows);

    console.log("Import complete.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
});