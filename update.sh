echo "Обновление Домашней библиотеки..."
cd ~/library-app
echo "Создание бэкапа данных..."
BACKUP_DIR="data_backup_$(date +%Y%m%d_%H%M%S)"
cp -r data "$BACKUP_DIR"
echo "Бэкап создан: $BACKUP_DIR"
echo "Загрузка обновлений из GitHub..."
git pull origin main
echo "Восстановление данных..."
cp -r "$BACKUP_DIR"/* data/
echo "Данные восстановлены"
echo "Перезапуск сервера..."
sudo systemctl restart library-app
echo "Обновление завершено!"
