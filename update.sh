#!/bin/bash

echo "🔄 Обновление Домашней библиотеки..."

cd ~/library-app

# ===== 1. БЭКАП ДАННЫХ =====
echo "📦 Создание бэкапа данных..."
BACKUP_DIR="data_backup_$(date +%Y%m%d_%H%M%S)"
cp -r data "$BACKUP_DIR"
echo "✅ Бэкап создан: $BACKUP_DIR"

# ===== 2. ОБНОВЛЕНИЕ КОДА =====
echo "⬇️ Загрузка обновлений из GitHub..."
git pull origin main

# ===== 3. ВОССТАНОВЛЕНИЕ ДАННЫХ =====
echo "📂 Восстановление данных..."
cp -r "$BACKUP_DIR"/* data/
echo "✅ Данные восстановлены"

# ===== 4. ПЕРЕЗАПУСК =====
echo "🔄 Перезапуск сервера..."
sudo systemctl restart library-app

echo "✅ Обновление завершено!"
echo "🌐 Откройте: http://$(hostname -I | awk '{print $1}'):4002"