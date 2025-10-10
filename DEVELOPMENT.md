# Development Setup Guide

## 🔧 Quick Start

### Prerequisites
- Java 17+
- Node.js 16+
- PostgreSQL 13+
- Maven 3.6+

### Backend Setup

1. **Resolve Dependencies**
   ```bash
   cd backend
   ./mvnw clean install
   ```

2. **Set Environment Variables**
   ```bash
   # Create .env file in backend directory
   JWT_SECRET=your-super-secure-jwt-secret-key-here-32-chars-min
   DATABASE_URL=jdbc:postgresql://localhost:5432/portfolio
   DATABASE_USERNAME=your_db_username
   DATABASE_PASSWORD=your_db_password
   ```

3. **Database Setup**
   ```sql
   -- Create database
   CREATE DATABASE portfolio;
   ```

4. **Run Application**
   ```bash
   ./mvnw spring-boot:run
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🚨 Known Issues & Solutions

### Backend Compilation Errors

If you encounter Actuator-related import errors:

1. **Refresh Maven Dependencies**
   ```bash
   cd backend
   ./mvnw clean install -U
   ```

2. **Re-enable Actuator Components**
   After successful dependency resolution, uncomment the code in:
   - `ActuatorSecurityConfig.java`
   - `ApplicationInfoContributor.java` 
   - `RefreshTokenHealthIndicator.java`

3. **IDE Refresh**
   - In IntelliJ: File → Reload Gradle/Maven Project
   - In VS Code: Reload Window (Ctrl+Shift+P → "Developer: Reload Window")

### TypeScript Errors

If you encounter TypeScript compilation issues:

1. **Clear TypeScript Cache**
   ```bash
   cd frontend
   npx tsc --build --clean
   ```

2. **Reinstall Dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📦 Fixed Issues

✅ **AuthResponse.token() Method**
- Fixed test references from `token()` to `accessToken()`

✅ **@NonNull Annotations**
- Added missing annotations to filter methods

✅ **TypeScript Configuration**
- Fixed tsconfig references and noEmit conflicts

✅ **Database Migrations**
- Fixed BCrypt password hashes
- Removed redundant indexes
- Standardized timestamp types

## 🔑 Default Credentials

**Admin Account:**
- Email: `admin@portfolio.com`
- Password: `admin123`

**Demo Account:**
- Email: `demo@portfolio.com`
- Password: `demo123`

## 🎯 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - Logout user

### Profiles
- `GET /api/v1/profiles` - List all profiles
- `GET /api/v1/profiles/{slug}` - Get profile by slug
- `PUT /api/v1/profiles/{id}` - Update profile (authenticated)

### Monitoring (when Actuator is enabled)
- `GET /actuator/health` - Application health status
- `GET /actuator/info` - Application information
- `GET /actuator/metrics` - Application metrics

## 🧪 Testing

### Backend Tests
```bash
cd backend
./mvnw test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
cd backend
./mvnw verify
```

## 🚀 Production Deployment

### Backend
```bash
cd backend
./mvnw clean package -Pprod
java -jar target/portfolio-backend-*.jar
```

### Frontend
```bash
cd frontend
npm run build
# Deploy dist/ folder to your web server
```

## 📊 Performance Features

- **JWT Auto-Refresh**: Automatic token renewal
- **Error Boundaries**: Comprehensive error handling
- **Performance Monitoring**: Core Web Vitals tracking
- **PWA Support**: Offline functionality and app installation
- **Image Optimization**: Responsive images with WebP support
- **SEO Enhancement**: Meta tags and structured data

## 🔒 Security Features

- **Rate Limiting**: API abuse prevention
- **CORS Configuration**: Cross-origin request security
- **JWT Security**: Secure token-based authentication
- **Input Validation**: Request validation and sanitization
- **SQL Injection Protection**: Parameterized queries

## 📚 Documentation

- **API Documentation**: Available at `/swagger-ui.html` (when enabled)
- **Frontend Components**: See `/frontend/src/components/`
- **Database Schema**: See `/backend/src/main/resources/db/migration/`