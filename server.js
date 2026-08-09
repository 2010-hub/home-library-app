const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const DB_FILE = path.join(__dirname, 'data', 'books.json');
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const LOCALES_DIR = path.join(__dirname, 'locales');

// Создаём папки
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}
if (!fs.existsSync(LOCALES_DIR)) {
    fs.mkdirSync(LOCALES_DIR, { recursive: true });
}

// ===== РАБОТА С JSON =====
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

// ===== ДАННЫЕ =====
let users = loadJSON(USERS_FILE, [
    { id: 1, username: 'admin', password: 'admin', role: 'admin' }
]);

let settings = loadJSON(SETTINGS_FILE, {
    library_name: 'Домашняя библиотека',
    theme: 'light',
    books_per_page: 24
});

let books = loadJSON(DB_FILE, []);

// ===== ФУНКЦИИ =====
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

// ===== ФУНКЦИЯ ДЛЯ ФЛАГОВ =====
function getFlag(code) {
    const flags = {
        'ru': '🇷🇺', 'en': '🇬🇧', 'fr': '🇫🇷', 'de': '🇩🇪',
        'es': '🇪🇸', 'zh': '🇨🇳', 'ja': '🇯🇵',  'it': '🇮🇹'
    };
    return flags[code] || '🌐';
}

// ===== HTTP СЕРВЕР =====
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

    // ===== API: GET /api/books =====
    if (pathname === '/api/books' && method === 'GET') {
        const search = parsedUrl.query.search || '';
        const result = getBooks(search);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: result }));
        return;
    }

    // ===== API: POST /api/books =====
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

    // ===== API: PUT /api/books/:id =====
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

    // ===== API: DELETE /api/books/:id =====
    if (pathname.startsWith('/api/books/') && method === 'DELETE') {
        const id = pathname.split('/')[3];
        const success = deleteBook(id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success }));
        return;
    }

    // ===== API: GET /api/settings =====
    if (pathname === '/api/settings' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: settings }));
        return;
    }

    // ===== API: POST /api/settings =====
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
    }

    // ===== API: POST /api/login =====
    if (pathname === '/api/login' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { username, password, role } = JSON.parse(body);
                const user = getUser(username);
                
                if (role === 'reader') {
                    if (user) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, role: 'reader' }));
                    } else {
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'Пользователь не найден' }));
                    }
                    return;
                }
                
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

    // ===== API: POST /api/update-password =====
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

    // ===== API: POST /api/clear-books =====
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
                
                exec('git --version', (err) => {
                    if (err) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: false, 
                            error: '❌ Git не установлен. Установите: sudo apt install git' 
                        }));
                        return;
                    }
                    
                    if (!fs.existsSync(path.join(__dirname, '.git'))) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: false, 
                            error: '❌ Папка не является git-репозиторием.' 
                        }));
                        return;
                    }
                    
                    const backupDir = path.join(__dirname, 'data_backup_' + Date.now());
                    exec(`cp -r "${__dirname}/data" "${backupDir}"`, (err) => {
                        if (err) console.log('⚠️ Бэкап не создан');
                        exec(`cd "${__dirname}" && git stash`, () => {
                            exec(`cd "${__dirname}" && git pull ${repoUrl || 'origin'} ${branch || 'main'}`, (error, stdout, stderr) => {
                                if (fs.existsSync(backupDir)) {
                                    exec(`cp -r "${backupDir}"/* "${__dirname}/data/"`, () => {
                                        exec(`rm -rf "${backupDir}"`);
                                    });
                                }
                                exec(`cd "${__dirname}" && git stash pop`, () => {});
                                if (error) {
                                    res.writeHead(200, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ success: false, error: stderr || error.message }));
                                    return;
                                }
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ success: true, message: '✅ Обновление успешно!' }));
                                setTimeout(() => {
                                    exec('sudo systemctl restart library-app', (err3) => {
                                        if (err3) console.log('⚠️ Ошибка перезапуска:', err3);
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

    // ===== API: GET /api/version =====
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

    // ===== API: GET /api/isbn/:isbn =====
    if (pathname.startsWith('/api/isbn/') && method === 'GET') {
        const isbn = pathname.split('/')[3];
        console.log(`🔍 Поиск по ISBN: ${isbn}`);
        
        const https = require('https');
        const url = `https://isbnsearch.org/isbn/${isbn}`;
        
        https.get(url, (apiRes) => {
            let data = '';
            apiRes.on('data', chunk => data += chunk);
            apiRes.on('end', () => {
                try {
                    const titleMatch = data.match(/<h1[^>]*>([^<]+)<\/h1>/);
                    const authorMatch = data.match(/<span[^>]*class="author"[^>]*>([^<]+)<\/span>/);
                    const publisherMatch = data.match(/<span[^>]*class="publisher"[^>]*>([^<]+)<\/span>/);
                    const yearMatch = data.match(/<span[^>]*class="year"[^>]*>([^<]+)<\/span>/);
                    const pagesMatch = data.match(/<span[^>]*class="pages"[^>]*>([^<]+)<\/span>/);
                    const coverMatch = data.match(/<img[^>]*class="cover"[^>]*src="([^"]+)"/);
                    
                    if (titleMatch) {
                        const result = {
                            title: titleMatch[1]?.trim() || '',
                            author: authorMatch?.[1]?.trim() || '',
                            publisher: publisherMatch?.[1]?.trim() || '',
                            year: yearMatch?.[1]?.trim() || '',
                            pages: pagesMatch?.[1]?.trim() || '',
                            cover: coverMatch?.[1] || ''
                        };
                        console.log(`✅ Найдено: ${result.title}`);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, data: result }));
                    } else {
                        console.log(`❌ Книга не найдена по ISBN: ${isbn}`);
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'Книга не найдена' }));
                    }
                } catch (e) {
                    console.error('Ошибка парсинга:', e);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: e.message }));
                }
            });
        }).on('error', (e) => {
            console.error('Ошибка запроса к ISBNsearch:', e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        });
        return;
    }

    // ===== API: GET /api/languages =====
    if (pathname === '/api/languages' && method === 'GET') {
        try {
            const files = fs.readdirSync(LOCALES_DIR);
            const languages = files
                .filter(f => f.endsWith('.json'))
                .map(f => {
                    const code = f.replace('.json', '');
                    const names = {
                        'ru': 'Русский', 'en': 'English', 'fr': 'Français',
                        'de': 'Deutsch', 'es': 'Español', 'uk': 'Українська',
                        'zh': '中文', 'ja': '日本語', 'it': 'Italiano',
                        'pt': 'Português', 'nl': 'Nederlands', 'pl': 'Polski'
                    };
                    return {
                        code: code,
                        name: names[code] || code.toUpperCase(),
                        flag: getFlag(code)
                    };
                });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: languages }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
        return;
    }

    // ===== СТАТИКА: locales/*.json =====
    if (pathname.startsWith('/locales/') && method === 'GET') {
        const filePath = path.join(__dirname, pathname);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not found');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(data);
            }
        });
        return;
    }

    // ===== СТАТИКА: index.html =====
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
    console.log('🌐 http://localhost:' + PORT);
    console.log('    http://<IP-адрес>:' + PORT);
});