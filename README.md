# Spendora - Smart Expense Tracker

<div align="center">
  <img src="https://img.shields.io/badge/React-19.0.0-blue" alt="React" />
  <img src="https://img.shields.io/badge/Vite-6.2.0-646CFF" alt="Vite" />
  <img src="https://img.shields.io/badge/Firebase-12.10.0-orange" alt="Firebase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.1.14-38B2AC" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-5.8.2-blue" alt="TypeScript" />
</div>

## 📋 Overview

Spendora is a modern, AI-powered expense tracking application built with React and Firebase. It helps users manage their finances with intelligent insights, debtor tracking, and seamless expense management. The app features a beautiful dark/light theme, real-time data synchronization, and AI assistance for financial analysis.

## ✨ Features

### 💰 Expense Management
- Add, edit, and categorize expenses
- Receipt upload and storage
- Split expenses with colleagues
- Real-time expense tracking

### 👥 Debtor Management
- Track money owed by others
- Record partial payments
- Automatic status updates
- Payment history

### 🤖 AI Assistant
- Get financial insights and recommendations
- Analyze spending patterns
- Budget suggestions
- Natural language queries

### 📊 Reports & Analytics
- Visual expense reports with charts
- Category-wise breakdowns
- Monthly/yearly summaries
- Export capabilities

### 🎨 User Experience
- Dark/Light theme support
- Responsive design for all devices
- Intuitive navigation
- Real-time notifications

### 🔐 Security & Privacy
- Secure Firebase authentication
- User-specific data isolation
- Encrypted data storage
- Privacy-focused design

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Lucide Icons
- **Backend**: Firebase (Firestore, Auth, Storage)
- **AI**: OpenRouter
- **Charts**: Recharts
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase project
- OpenRouter API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/spendora.git
   cd spendora
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase config and server-side AI key:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   OPENROUTER_API_KEY=your_server_openrouter_api_key
   ```

4. **Run locally**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 📦 Build & Deploy

### Local Build
```bash
npm run build
npm run preview
```

### Deploy to Vercel

1. **Connect to Vercel**
   - Push your code to GitHub
   - Connect your GitHub repo to Vercel
   - Vercel will automatically detect the Vite configuration

2. **Environment Variables**
   Set these in Vercel dashboard under Project Settings > Environment Variables:
   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   VITE_FIREBASE_MEASUREMENT_ID
   OPENROUTER_API_KEY
   ```

   Firebase note: this repo includes [storage.rules](./storage.rules) and [firestore.rules](./firestore.rules). Deploy both rulesets before exposing uploads publicly.

3. **Deploy**
   - Vercel will build and deploy automatically on git push
   - Your app will be live at `https://your-project.vercel.app`

## 📱 Usage

### Getting Started
1. **Sign Up/Login**: Create an account or sign in with Google
2. **Set Preferences**: Choose your currency and theme
3. **Add Categories**: Create custom expense categories
4. **Start Tracking**: Add your first expense

### Key Workflows
- **Add Expense**: Click "Expenses" → "New Expense" → Fill details
- **Track Debtors**: Go to "Debtors" → Add new debtor → Record payments
- **View Reports**: Access "Reports" for visual analytics
- **AI Insights**: Chat with AI assistant for financial advice

## 🏗️ Project Structure

```
spendora/
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # React contexts (Auth, Data, Theme)
│   ├── pages/          # Main application pages
│   ├── utils/          # Helper functions
│   └── firebase.ts     # Firebase configuration
├── public/             # Static assets
├── dist/              # Build output
└── package.json       # Dependencies and scripts
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run TypeScript checks

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Husky for git hooks (if configured)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ by [Insath Raif](https://github.com/your-username)
- Icons by [Lucide](https://lucide.dev/)
- UI inspiration from modern design systems

## 📞 Support

If you have any questions or need help:
- Open an issue on GitHub
- Contact: [insathraif004@gmail.com]

---

**Star this repo if you find it useful! ⭐**
