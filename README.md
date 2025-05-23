# WhatsApp AI Reply Bot

A comprehensive WhatsApp AI reply bot application with Mistral AI integration, featuring a modern web interface for message management and real-time monitoring.

## 🚀 Features

### Core Functionality
- **WhatsApp Integration**: Uses Baileys library for WhatsApp Web API
- **AI-Powered Responses**: Mistral AI integration for intelligent auto-replies
- **Real-time Updates**: WebSocket-based live message updates
- **Message Management**: Complete message history and conversation tracking
- **Auto-Reply Control**: Toggle AI responses on/off

### UI/UX Features
- **Modern Interface**: Clean, responsive design with smooth animations
- **Dark Mode**: Full dark/light theme support with system preference detection
- **Mobile Responsive**: Optimized for all device sizes
- **Real-time Status**: Live connection status indicators
- **Message Bubbles**: WhatsApp-style message display

### Technical Features
- **Production Ready**: Comprehensive error handling and logging
- **Database Storage**: SQLite for message persistence
- **Session Management**: Automatic reconnection and session handling
- **Rate Limiting**: Built-in API rate limiting
- **Security**: Helmet.js security headers and CORS protection

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- WhatsApp account for QR code scanning

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd whatsapp-ai-bot

# Install all dependencies
npm run install:all
```

### 2. Environment Configuration

The `.env` file is already configured with the Mistral AI API key. You can modify other settings as needed:

```env
# Mistral AI Configuration
MISTRAL_API_KEY=GbPjMq7H8iMU6NJsjtJTgRTt8KIIe7EV
MISTRAL_MODEL=mistral-large-latest

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Configuration (change in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Database Configuration
DB_PATH=./data/messages.db

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./sessions
WHATSAPP_AUTO_REPLY=true

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### 3. Start the Application

```bash
# Development mode (starts both backend and frontend)
npm run dev

# Or start individually
npm run backend:dev  # Backend only
npm run frontend:dev # Frontend only

# Production mode
npm run backend:start
```

## 🚀 Usage

### 1. Initial Setup

1. Start the application using `npm run dev`
2. Open your browser and navigate to `http://localhost:3000`
3. You'll see the login page with connection status

### 2. WhatsApp Connection

1. The application will automatically generate a QR code
2. Open WhatsApp on your phone
3. Go to **Settings** → **Linked Devices**
4. Tap **"Link a Device"**
5. Scan the QR code displayed on the web interface
6. Once connected, you'll be redirected to the dashboard

### 3. Dashboard Features

#### Message Management
- View all incoming and outgoing messages in real-time
- Messages are grouped by date with timestamps
- Different message types (text, image, video, etc.) are supported
- AI responses are clearly marked and displayed

#### Auto-Reply Control
- Toggle AI auto-reply on/off from the dashboard
- Test AI service connectivity
- View response statistics

#### Manual Message Sending
- Send messages to any WhatsApp number
- Use format: `1234567890@s.whatsapp.net` for individual chats
- Group chats use format: `groupid@g.us`

### 4. AI Response Customization

The AI responses are powered by Mistral AI and can be customized by modifying the system prompt in `backend/src/services/mistralService.js`.

## 📁 Project Structure

```
whatsapp-ai-bot/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── services/        # Business logic services
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── server.js           # Entry point
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   └── styles/         # CSS styles
│   ├── package.json
│   └── vite.config.js      # Vite configuration
├── data/                   # SQLite database
├── logs/                   # Application logs
├── sessions/               # WhatsApp session data
├── .env                    # Environment variables
├── package.json            # Root package.json
└── README.md
```

## 🔧 API Endpoints

### WhatsApp Endpoints
- `GET /api/whatsapp/status` - Get connection status
- `POST /api/whatsapp/connect` - Initiate connection
- `POST /api/whatsapp/disconnect` - Disconnect from WhatsApp
- `POST /api/whatsapp/send-message` - Send a message
- `POST /api/whatsapp/toggle-auto-reply` - Toggle auto-reply
- `GET /api/whatsapp/auto-reply-status` - Get auto-reply status

### Message Endpoints
- `GET /api/messages` - Get all messages
- `GET /api/messages/:number` - Get messages by phone number
- `POST /api/messages/send` - Send a message
- `DELETE /api/messages/:id` - Delete a message

### AI Endpoints
- `POST /api/ai/test` - Test AI service
- `POST /api/ai/generate-response` - Generate AI response

### Settings Endpoints
- `GET /api/settings` - Get application settings
- `POST /api/settings` - Update settings

## 🔌 WebSocket Events

### Client → Server
- `connection` - Client connects to server

### Server → Client
- `qr-code` - QR code generated for WhatsApp login
- `connection-status` - WhatsApp connection status updates
- `new-message` - New incoming message
- `ai-response` - AI response generated and sent
- `auto-reply-status` - Auto-reply status changed
- `connection-error` - Connection error occurred

## 🛡️ Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing protection
- **Rate Limiting**: API rate limiting (100 requests per 15 minutes)
- **Input Validation**: Request validation and sanitization
- **Error Handling**: Comprehensive error handling without exposing internals

## 📊 Monitoring and Logging

- **Winston Logging**: Structured logging with different levels
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Request timing and performance metrics
- **Health Checks**: `/health` endpoint for monitoring

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MISTRAL_API_KEY` | Mistral AI API key | Required |
| `MISTRAL_MODEL` | Mistral AI model | `mistral-large-latest` |
| `PORT` | Backend server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `JWT_SECRET` | JWT signing secret | Change in production |
| `DB_PATH` | SQLite database path | `./data/messages.db` |
| `WHATSAPP_SESSION_PATH` | WhatsApp session storage | `./sessions` |
| `WHATSAPP_AUTO_REPLY` | Enable auto-reply by default | `true` |

### Database Schema

The application uses SQLite with the following tables:

- **messages**: Store all WhatsApp messages
- **sessions**: Store WhatsApp session information
- **settings**: Store application settings

## 🚨 Troubleshooting

### Common Issues

1. **QR Code Not Generating**
   - Check if port 3001 is available
   - Ensure WhatsApp Web is not open in another browser
   - Restart the application

2. **Connection Drops**
   - Check internet connectivity
   - WhatsApp may have logged out the session
   - Clear session data and reconnect

3. **AI Responses Not Working**
   - Verify Mistral API key is correct
   - Check API rate limits
   - Test AI service using the dashboard

4. **Messages Not Appearing**
   - Check WebSocket connection
   - Verify database permissions
   - Check browser console for errors

### Logs

Check the following log files for debugging:
- `logs/combined.log` - All application logs
- `logs/error.log` - Error logs only
- Console output in development mode

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This bot is for educational and personal use only. Make sure to comply with WhatsApp's Terms of Service and local regulations when using automated messaging systems.

## 🆘 Support

For support and questions:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Create an issue on the repository
4. Ensure you're using the latest version

---

**Built with ❤️ using Node.js, React, Baileys, and Mistral AI**
