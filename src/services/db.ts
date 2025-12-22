import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const initDB = async () => {
    if (db) return db;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            const database = await SQLite.openDatabaseAsync('checkerq.db');
            console.log('Database opened');

            await database.execAsync('PRAGMA foreign_keys = ON;');

            // Ensure tables exist
            await database.execAsync(`
                CREATE TABLE IF NOT EXISTS assessments (
                    id TEXT PRIMARY KEY NOT NULL,
                    title TEXT NOT NULL,
                    teacherName TEXT,
                    subject TEXT,
                    classRoom TEXT,
                    paperImages TEXT,
                    createdAt INTEGER NOT NULL
                )
            `);

            await database.execAsync(`
                CREATE TABLE IF NOT EXISTS questions (
                    id TEXT PRIMARY KEY NOT NULL,
                    assessmentId TEXT NOT NULL,
                    text TEXT NOT NULL,
                    marks INTEGER NOT NULL,
                    type TEXT NOT NULL,
                    instruction TEXT,
                    options TEXT,
                    FOREIGN KEY (assessmentId) REFERENCES assessments (id) ON DELETE CASCADE
                )
            `);

            await database.execAsync(`
                CREATE TABLE IF NOT EXISTS evaluations (
                    id TEXT PRIMARY KEY NOT NULL,
                    assessmentId TEXT NOT NULL,
                    studentImage TEXT NOT NULL,
                    totalMarks INTEGER NOT NULL,
                    obtainedMarks INTEGER NOT NULL,
                    overallFeedback TEXT,
                    results TEXT,
                    createdAt INTEGER NOT NULL,
                    status TEXT DEFAULT 'completed',
                    FOREIGN KEY (assessmentId) REFERENCES assessments (id) ON DELETE CASCADE
                )
            `);

            db = database;
            console.log('Database initialized successfully');
            return db;
        } catch (error) {
            console.error('Database init failed:', error);
            initPromise = null;
            throw error;
        }
    })();

    // Attempt to add studentName column if it's missing (simple migration)
    initPromise.then(async (database) => {
        try {
            await database.execAsync('ALTER TABLE evaluations ADD COLUMN studentName TEXT;');
        } catch (e) { /* ignore */ }

        try {
            await database.execAsync('ALTER TABLE evaluations ADD COLUMN pages TEXT;');
        } catch (e) { /* ignore */ }
    });

    return initPromise;
};

export const getDB = async () => {
    if (!db) {
        return await initDB();
    }
    return db;
};
