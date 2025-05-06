# Food Pantry Client Management System - Demo

A Progressive Web Application (PWA) for managing food pantry clients, orders, and phone interactions.

![GitHub License](https://img.shields.io/github/license/RobinM88/Food_Pantry_Demo)

## 🚀 Demo Version

**This is a demo version** of the Food Pantry Client Management System that runs completely in demo mode. It uses:
- Local browser storage instead of an external database
- Sample data for demonstration purposes
- All features run offline

## ✨ Features

- **📋 Client Management**
  - Add, edit, and view client profiles
  - Track family size and composition
  - Record special needs and dietary restrictions
  
- **🛒 Order Tracking**
  - Create new food orders
  - Update order statuses
  - View order history
  
- **📞 Phone Log System**
  - Record client calls
  - Track call outcomes
  - Link calls to client profiles
  
- **👨‍👩‍👧‍👦 Connected Families**
  - Link related family records
  - Manage family relationships
  - View connected client information

- **📱 Offline Support**
  - Works without internet connection
  - Data stored in browser

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Material UI
- **Build**: Vite
- **Storage**: IndexedDB (browser storage)
- **PWA Features**: Service Workers, Offline Support
- **State Management**: React Context API

## 🚦 Getting Started

1. Clone the repository:
```bash
git clone https://github.com/RobinM88/Food_Pantry_Demo.git
cd Food_Pantry_Demo
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm run preview
```

## 📸 Screenshots

[Screenshots to be added]

## 📘 Usage Examples

### Adding a Client
1. Navigate to the Clients page
2. Click "Add Client"
3. Fill in the required information
4. Click "Save"

### Creating an Order
1. Navigate to the Orders page or a client's profile
2. Click "New Order"
3. Select items and quantities
4. Click "Submit Order"

### Managing Connected Families
1. Navigate to the Family Connections page
2. Search for a family to connect
3. Select relationship type
4. Confirm the connection

## ⚙️ Configuration

The application uses the following environment variables (already set for demo mode):

- `VITE_DEMO_MODE`: Set to "true" for demo mode
- `VITE_APP_NAME`: Application name
- `VITE_APP_DESCRIPTION`: Application description

## 📝 Notes

- This demo version uses generated sample data
- No server connectivity is required
- All data is stored in your browser and will persist between sessions

## 📄 License

MIT

## 🙏 Acknowledgements

- React Team
- Material UI
- The Vite Project
- All open-source contributors 