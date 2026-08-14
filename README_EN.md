![SVG Banners](https://svg-banners.vercel.app/api?type=luminance&text1=Home-Library-App%20&width=1200&height=210)

A web app for cataloging your personal book collection. It was developed for Raspberry Pi, but can run on any device running Node.js. If you don't have a server, you can install our [Desktop version of the app](https://github.com/2010-hub/home-library-desktop). **Our Telegram channel:** ***https://t.me/Serpent_lab***<!-- repository description -->
<!-- Repository information block in badges -->
![Static Badge](https://img.shields.io/badge/by-SerpentBot_Laboratory-purple?logo=github)
![GitHub top language](https://img.shields.io/github/languages/top/2010-hub/home-library-app)
![GitHub](https://img.shields.io/github/license/2010-hub/home-library-app)
![GitHub Repo stars](https://img.shields.io/github/stars/2010-hub/home-library-app)
![GitHub issues](https://img.shields.io/github/issues/2010-hub/home-library-app)

<!--User Documentation-->
## Documentation

### 🔐 Two Access Modes
| Mode | Features |
|-------|-------------|
| **Administrator** | Adding, editing, deleting books, system settings (login with password) |
| **Reader** | Only viewing the catalog without editing (login without password) |

### 📚 Book Management
- Adding books with covers (uploading images)
- Editing and deleting books
- Automatic ISBN search (Google Books API) (under development)
- Fields: title, author, ISBN, genre, series, publisher, year of publication, number of pages, storage location, link to electronic version

### 🖼️ 3 catalog viewing modes
| Mode | Description |
|-------|----------|
| **Cards** | Visual view with covers |
| **Table** | All data in table format |
| **Gallery** | Large covers for quick searching (only the title and cover are visible) |

### 🔎 Search and sort
- Search by title, author, ISBN, genre, series, publisher, storage location
- Sort by any field (ascending/descending)

### ⚙️ Settings
- Change administrator password
- Change library name
- Choose theme (light/dark)
- Set the number of books per page
- Export data (JSON/CSV)
- Import data from backup
- Update firmware from GitHub

### 🔒 Security
- Data is stored in JSON files (no external database)
- Easy installation
- Separation of code and data (data is preserved during updates)

<!--Installation-->
## Installation (Linux)
You must have [**project dependencies**](https://github.com/2010-hub/home-library-app#dependencies) installed

**1. Clone the repository**

```git clone https://github.com/2010-hub/home-library-app.git```

**2. Change to the library-app directory**

```cd library-app```

**3. Start the server**

```node server.js```

**4. Open in a browser**

All done! All that's left is to open ```http://<your-device-IP-address>:4002``` and enter **Login:** admin **Password:** admin

**5. Update your password**

Go to settings (by clicking the gear in the upper right corner) and change your password.

<!--Support-->
## Support
If you have any issues, ideas for updates, or questions about using the package, please create a
[**discussion**](https://github.com/2010-hub/home-library-app/issues/new/choose) in this repository or message us in our [**Telegram**](https://t.me/Serpent_lab) channel.

<!--Dependencies-->
## Dependencies
This program requires **Node.js** to be installed. If you notice that this software can be run on a lower version, or if it doesn't work on any version, please contact [**support**](https://github.com/2010-hub/home-library-app/issues/new/choose)

**1. Installing Node.js**

```curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -```

```sudo apt install -y nodejs```

**2. Verifying the Installation**

```node --version # Must be v18.x.x```

```npm --version # Must be v9.x.x or higher```

## Screenshots
Screenshots of a version of the program can be found in the [**application release**](https://github.com/2010-hub/home-library-app/releases)
