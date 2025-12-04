# 💰 WalletAlert

> **A smart budgeting companion designed for students who value simplicity and control**

WalletAlert is your no-fuss financial tracking solution. Set weekly and category budgets, log expenses in seconds, visualize spending trends with intuitive charts, and receive proactive alerts before you overspend. Built with modern web technologies and secured with Auth0, it keeps your financial data safe while staying refreshingly simple.

---

## ✨ What Makes WalletAlert Special

🎯 **Student-Focused Design** – Built for real student budgets and spending patterns  
⚡ **Lightning Fast** – Log expenses in seconds  
📊 **Visual Insights** – Clear charts show exactly where your money goes  
🔔 **Smart Alerts** – Get notified as you approach budget limits  
🔒 **Secure by Default** – Auth0 authentication keeps your data protected  
🚀 **Deploy Anywhere** – Works locally or on Render with zero hassle

---

## 🛠 Tech Stack

<table>
<tr>
<td width="50%">

**Frontend**
- ⚛️ React + Vite
- 📈 Recharts for data visualization
- 🎨 Modern, responsive UI

</td>
<td width="50%">

**Backend**
- 🟢 Node.js + Express
- 🍃 MongoDB for data persistence
- 🔐 Auth0 for authentication
- 🧪 Vitest for testing

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm package manager
- MongoDB instance (local or cloud)
- Auth0 account

### 🔧 API Setup

```bash
# Navigate to API directory
cd walletalert/apps/api

# Create environment file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

**Environment Variables Required:**
- `AUTH0_AUDIENCE` – Your Auth0 API identifier
- `AUTH0_ISSUER_BASE_URL` – Your Auth0 domain
- `MONGO_URI` – MongoDB connection string
- `WEB_ORIGIN` – Frontend URL for CORS
- `PORT` – Server port (default: 3000)

### 🎨 Web App Setup

```bash
# Navigate to web directory
cd walletalert/apps/web

# Create environment file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

**Environment Variables Required:**
- `VITE_API_BASE_URL` – Backend API URL
- `VITE_AUTH0_DOMAIN` – Your Auth0 domain
- `VITE_AUTH0_CLIENT_ID` – Your Auth0 client ID
- `VITE_AUTH0_AUDIENCE` – Your Auth0 API audience

---

## 📁 Project Structure

```
software-engineering-project-walletalert/
├── walletalert/apps/
│   ├── api/                 # Express backend
│   │   └── src/
│   │       ├── routes/      # REST endpoints
│   │       ├── auth.js      # Auth0 middleware
│   │       ├── db.js        # MongoDB connection
│   │       └── store.js     # In-memory fallback
│   └── web/                 # React frontend
│       └── src/
│           ├── api/         # Axios client
│           ├── components/  # UI components
│           └── utils/       # Helper functions
├── diagrams/                # UML diagrams (.puml + .png)
├── doc/                     # API & web documentation
├── unit-test/               # Vitest test suite
├── Mockup/                  # UI mockups
└── README.md
```

---

## 📊 System Architecture

### Use Case Model
The system supports four main use cases: managing expenses (add, categorize, edit), setting and adjusting budgets, monitoring spending with alerts, and viewing weekly/monthly reports.

<p align="center">
  <img src="diagrams/use-case-model.png" alt="Use case model showing user interactions" width="800" />
</p>

### Domain Model
Core domain concepts include Student, Expense, Category, Budget, Alert, and SummaryReport, with relationships that enforce budget rules and expense categorization.

<p align="center">
  <img src="diagrams/domain-model.png" alt="Domain model showing data relationships" width="800" />
</p>

### Sequence Diagram: Adding an Expense
This sequence diagram illustrates the process of a student adding a new expense, from the frontend input to backend processing and database storage.
<p align="center">
  <img src="diagrams/add-expense-sequence.png" alt="Sequence diagram for adding an expense" width="800" />
</p>

---

## 📚 Documentation

- **`doc/api.md`** – Comprehensive API endpoint documentation
- **`doc/web.md`** – Frontend component and service guide
- **`diagrams/`** – PlantUML source files for all diagrams
- **`WalletAlert_All_In_Order.txt`** – Consolidated UML documentation

---

## 💡 Development Notes

### 🧪 Testing
```bash
cd unit-test
npm install
npm test
```

### 🐛 Development Mode Features
- **In-Memory Fallback**: API uses in-memory storage when MongoDB isn't configured
- **Helpful Errors**: Web app shows clear messages for missing Auth0 configuration
- **Hot Reload**: Both API and web support live reloading during development

### 🌐 Deployment
Both API and web apps are configured for seamless deployment on Render:
- **API**: Automatically detects production environment
- **Web**: Optimized build with `npm run build`

---