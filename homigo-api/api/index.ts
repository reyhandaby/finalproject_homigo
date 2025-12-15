import serverlessHttp from "serverless-http";
import app from "../src/app";

export default serverlessHttp(app);

