require('dotenv').config();
const http = require('http');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Настройки PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'projects',
    password: '2020lmn',
    port: 5432,
});

// Настройки SMTP для отправки email
const transporter = nodemailer.createTransport({
    service: 'gmail',  // Или другой SMTP сервер
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Функция отправки кода подтверждения
async function sendVerificationEmail(email, code) {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Email Verification",
        text: `Your verification code is: ${code}`
    });
}

// Функция обработки запросов
const server = http.createServer(async (req, res) => {
    if (req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            const data = JSON.parse(body);

            // Регистрация пользователя
            if (req.url === '/register') {
                try {
                    const { username, email, password } = data;
                    const hashedPassword = await bcrypt.hash(password, 10);
                    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

                    await pool.query(
                        'INSERT INTO users_4 (username, email, password, verification_code) VALUES ($1, $2, $3, $4)',
                        [username, email, hashedPassword, verificationCode]
                    );

                    await sendVerificationEmail(email, verificationCode);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: "User registered. Check your email!" }));
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Registration failed" }));
                }
            }

            // Подтверждение email
            else if (req.url === '/verify') {
                try {
                    const { email, code } = data;

                    const result = await pool.query('SELECT * FROM users_4 WHERE email = $1', [email]);
                    if (result.rows.length === 0 || result.rows[0].verification_code !== code) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: "Invalid code" }));
                        return;
                    }

                    await pool.query('UPDATE users_4 SET is_verified = true WHERE email = $1', [email]);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: "Email verified!" }));
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Verification failed" }));
                }
            }

            // Авторизация пользователя
            else if (req.url === '/login') {
                try {
                    const { email, password } = data;

                    const result = await pool.query('SELECT * FROM users_4 WHERE email = $1', [email]);
                    if (result.rows.length === 0) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: "User not found" }));
                        return;
                    }

                    const user = result.rows[0];
                    if (!user.is_verified) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: "Email not verified" }));
                        return;
                    }

                    const match = await bcrypt.compare(password, user.password);
                    if (!match) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: "Invalid credentials" }));
                        return;
                    }

                    const token = jwt.sign({ id: user.id }, 'your_secret_key', { expiresIn: '1h' });

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: "Login successful", token }));
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Login failed" }));
                }
            }
        });
    }
});

// Запуск сервера
server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
