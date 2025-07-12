import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import tollRouter from './routes/toll';

dotenv.config();

const PORT:number = parseInt(process.env['PORT'] || '3000');
export const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/toll', tollRouter);

app.get('/', (req, res) => {
  res.send('Welcome to Lahore Ring Road Toll System');
});
export default app;
export const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
