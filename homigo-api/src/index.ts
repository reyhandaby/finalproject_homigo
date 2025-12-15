import app, { prisma } from "./app";
import { env } from "./config/env";

const port = 4000;

async function main() {
  try {
    if (process.env.NODE_ENV !== "production") {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }
    if (env.DATABASE_URL) {
      await prisma.$connect();
    } else {
      console.warn("DATABASE_URL not set; API will start but DB access will fail.");
    }
    app.listen(port, () => {
      console.log(`API listening on ${env.API_URL}`);
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
