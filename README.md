# Jeeva.AI - Patient-Centric Health Management Platform

A comprehensive health management platform that empowers patients with AI-driven health insights and consent-based data sharing.

## 🏥 Features

- **Patient Dashboard**: Comprehensive health overview and record management
- **Doctor Dashboard**: Professional tools for healthcare providers
- **AI-Powered Analysis**: Intelligent health record analysis and insights
- **Real-time Notifications**: Instant updates and alerts
- **Consent Management**: Patient-controlled data sharing
- **Health Records**: Secure storage and management of medical documents
- **Authentication**: Secure user authentication and role-based access

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase
- **AI Integration**: Custom health analysis algorithms
- **State Management**: React Query + Context API
- **Routing**: React Router DOM

## 🛠️ Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nvtarakanadh/jeeva_ai_prototype.git
   cd jeeva_ai_prototype
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8081` (or the port shown in terminal)

## 🌐 Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Deploy automatically

2. **Environment Variables**
   Set these in Vercel dashboard:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Other Platforms
- **Netlify**: Connect GitHub repo and deploy
- **GitHub Pages**: Use GitHub Actions for deployment
- **AWS Amplify**: Connect repository and configure build settings

## 📱 Usage

### For Patients
1. **Register/Login** with your credentials
2. **Upload Health Records** securely
3. **Get AI Insights** on your health data
4. **Manage Consent** for data sharing
5. **Track Health Trends** over time

### For Doctors
1. **Professional Login** with credentials
2. **Access Patient Records** (with consent)
3. **Provide Medical Insights** and recommendations
4. **Manage Patient Care** efficiently

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Set up the database schema
3. Configure authentication
4. Add environment variables

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, email support@jeeva.ai or create an issue in this repository.

## 🔗 Links

- **Live Demo**: [Deployed on Vercel]
- **Documentation**: [Coming Soon]
- **API Docs**: [Coming Soon]

---

**Built with ❤️ for better healthcare**