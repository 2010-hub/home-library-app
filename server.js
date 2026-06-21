const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const DB_FILE = path.join(__dirname, 'data', 'books.json');
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

function loadJSON(file, defaultData) {
    try {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            return JSON.parse(content);
        }
    } catch (e) {
        console.error('Ошибка загрузки', file, e);
    }
    return JSON.parse(JSON.stringify(defaultData));
}

function saveJSON(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        console.log('✅ Сохранено:', file);
        return true;
    } catch (e) {
        console.error('❌ Ошибка сохранения', file, e);
        return false;
    }
}

let users = loadJSON(USERS_FILE, [
    { id: 1, username: 'admin', password: 'admin', role: 'admin' }
]);

let settings = loadJSON(SETTINGS_FILE, {
    library_name: 'Домашняя библиотека',
    theme: 'light',
    books_per_page: 24
});

let books = loadJSON(DB_FILE, []);

function getUser(username) {
    return users.find(u => u.username === username);
}

function updateUser(username, newPassword) {
    const user = users.find(u => u.username === username);
    if (!user) {
        console.log('❌ Пользователь не найден:', username);
        return false;
    }
    user.password = newPassword;
    const result = saveJSON(USERS_FILE, users);
    console.log('✅ Пароль обновлен для:', username);
    return result;
}

function getBooks(search = '') {
    if (!search) return books;
    const s = search.toLowerCase();
    return books.filter(b => 
        b.title.toLowerCase().includes(s) ||
        b.author.toLowerCase().includes(s) ||
        (b.isbn && b.isbn.includes(s)) ||
        (b.genre && b.genre.toLowerCase().includes(s)) ||
        (b.series && b.series.toLowerCase().includes(s)) ||
        (b.publisher && b.publisher.toLowerCase().includes(s)) ||
        (b.location && b.location.toLowerCase().includes(s))
    );
}

function addBook(data) {
    const newBook = {
        id: Date.now().toString(),
        title: data.title || '',
        author: data.author || '',
        isbn: data.isbn || '',
        genre: data.genre || '',
        series: data.series || '',
        publisher: data.publisher || '',
        year: data.year || '',
        pages: data.pages || '',
        location: data.location || '',
        link: data.link || '',
        cover: data.cover || '',
        created_at: new Date().toISOString()
    };
    books.unshift(newBook);
    saveJSON(DB_FILE, books);
    return newBook;
}

function updateBook(id, data) {
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return null;
    books[idx] = { ...books[idx], ...data };
    saveJSON(DB_FILE, books);
    return books[idx];
}

function deleteBook(id) {
    const filtered = books.filter(b => b.id !== id);
    if (filtered.length === books.length) return false;
    books = filtered;
    saveJSON(DB_FILE, books);
    return true;
}

function clearAllBooks() {
    books = [];
    saveJSON(DB_FILE, books);
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    console.log(`${method} ${pathname}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (pathname === '/api/books' && method === 'GET') {
        const search = parsedUrl.query.search || '';
        const result = getBooks(search);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: result }));
        return;
    }

    if (pathname === '/api/books' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const book = addBook(data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: book }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    if (pathname.startsWith('/api/books/') && method === 'PUT') {
        const id = pathname.split('/')[3];
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const book = updateBook(id, data);
                if (book) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, data: book }));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Книга не найдена' }));
                }
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    if (pathname.startsWith('/api/books/') && method === 'DELETE') {
        const id = pathname.split('/')[3];
        const success = deleteBook(id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success }));
        return;
    }

    if (pathname === '/api/settings' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: settings }));
        return;
    }

    if (pathname === '/api/settings' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                settings = { ...settings, ...data };
                saveJSON(SETTINGS_FILE, settings);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }// ===== API: GET /api/version =====
    if (pathname === '/api/version' && method === 'GET') {
        try {
            const packagePath = path.join(__dirname, 'package.json');
            let version = '1.0.0';
            if (fs.existsSync(packagePath)) {
                const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                version = packageData.version || '1.0.0';
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, version: version }));
        } catch (e) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, version: '1.0.0' }));
        }
        return;
    }

    

    // ===== ЛОГИН: читатель входит без пароля =====
    if (pathname === '/api/login' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { username, password, role } = JSON.parse(body);
                
                // Читатель - ВХОД БЕЗ ПАРОЛЯ
                if (role === 'reader') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, role: 'reader' }));
                    return;
                }
                
                // Администратор - проверяем пароль
                const user = getUser(username);
                if (user && user.password === password) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, role: 'admin' }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Неверный логин или пароль' }));
                }
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    if (pathname === '/api/update-password' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { username, password } = JSON.parse(body);
                console.log('📝 Обновление пароля для:', username);
                const success = updateUser(username, password);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success, message: success ? 'Пароль обновлен' : 'Ошибка обновления' }));
            } catch (e) {
                console.error('❌ Ошибка обновления пароля:', e);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    if (pathname === '/api/clear-books' && method === 'POST') {
        clearAllBooks();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    // ===== API: POST /api/update =====
if (pathname === '/api/update' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const { repoUrl, branch } = JSON.parse(body);
            const { exec } = require('child_process');
            const fs = require('fs');
            
            // Проверяем git
            exec('git --version', (err) => {
                if (err) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: '❌ Git не установлен' 
                    }));
                    return;
                }
                
                if (!fs.existsSync(path.join(__dirname, '.git'))) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: '❌ Не git-репозиторий' 
                    }));
                    return;
                }
                
                // Бэкап данных
                const backupDir = path.join(__dirname, 'data_backup_' + Date.now());
                exec(`cp -r "${__dirname}/data" "${backupDir}"`, (err) => {
                    if (err) console.log('⚠️ Бэкап не создан');
                    
                    // Stash изменений
                    exec(`cd "${__dirname}" && git stash`, () => {
                        
                        // Обновление
                        exec(`cd "${__dirname}" && git pull ${repoUrl || 'origin'} ${branch || 'main'}`, (error, stdout, stderr) => {
                            
                            // Восстановление данных
                            if (fs.existsSync(backupDir)) {
                                exec(`cp -r "${backupDir}"/* "${__dirname}/data/"`, () => {
                                    exec(`rm -rf "${backupDir}"`);
                                });
                            }
                            
                            // Восстановление stash
                            exec(`cd "${__dirname}" && git stash pop`, () => {});
                            
                            // ===== ВАЖНО: СНАЧАЛА ОТВЕЧАЕМ БРАУЗЕРУ =====
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ 
                                success: true, 
                                message: '✅ Обновление успешно! Сервер перезапускается...' 
                            }));
                            
                            // ===== ПОТОМ ПЕРЕЗАПУСКАЕМ СЕРВЕР =====
                            setTimeout(() => {
                                exec('sudo systemctl restart library-app', (err3) => {
                                    if (err3) {
                                        console.log('⚠️ Ошибка перезапуска:', err3);
                                    }
                                });
                            }, 1000);
                        });
                    });
                });
            });
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
    });
    return;
}
    if (pathname === '/' || pathname === '/index.html') {
        const htmlPath = path.join(__dirname, 'index.html');
        fs.readFile(htmlPath, (err, data) => {
            if (err) {
                console.error('HTML read error:', err);
                res.writeHead(500);
                res.end('Server error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(data);
            }
        });
        return;
    }

    res.writeHead(404);
    res.end('Not found');
});

const PORT = 4002;
server.listen(PORT, '0.0.0.0', () => {
    console.log('\n📚 Домашняя библиотека запущена!');
    console.log('🌐 http://localhost:' + PORT);
    console.log('🔗 http://<IP-адрес>:' + PORT);
    console.log('👤 Логин: admin');
    console.log('🔑 Пароль: admin');
    console.log('📁 Данные хранятся в JSON файлах в папке data/\n');
});
