import { Client } from 'pg';

const { user, password, host, port, database } = process.env;

const client = new Client({ user, password, host, port, database });
(async () => await pg.connect())();

export const pg = client;
