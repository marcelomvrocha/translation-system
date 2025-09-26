# Quick Start Guide

## 🚀 **Get Started in 5 Minutes**

### **Prerequisites Check**
- ✅ Node.js 18+ installed
- ✅ PostgreSQL 15+ running
- ✅ Git repository cloned

### **Step 1: Start the Application**

#### **Option A: Quick Start (Current Setup)**
The application is already running! Access it at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001

#### **Option B: Fresh Start**
```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend  
npm install
npm run dev
```

### **Step 2: Login to the Application**

1. **Open your browser** and go to http://localhost:3000
2. **Login with test credentials**:
   - **Admin**: `admin@example.com` / `password123`
   - **Translator**: `translator@example.com` / `password123`
   - **Reviewer**: `reviewer@example.com` / `password123`

### **Step 3: Explore the Features**

#### **🏠 Dashboard**
- View project statistics
- Quick access to recent projects
- User profile information

#### **📁 Project Management**
- **Navigate to Projects** (click "Projects" in sidebar)
- **Create New Project**:
  - Click "New Project" button
  - Fill in project details (name, description, languages)
  - Click "Create"
- **View Project Details**:
  - Click on any project card
  - View project information and collaborators
  - Upload files using drag-and-drop

#### **🌐 Translation Interface**
- **Access Translation Interface**:
  - Go to any project details page
  - Click "Translate" button
  - Or navigate to `/projects/{id}/translate`
- **Translate Segments**:
  - Edit translations directly in the grid
  - Use auto-save functionality
  - Filter and search segments
  - Use bulk operations for multiple segments

#### **📤 File Upload & Parsing**
- **Go to any project** (click on project card)
- **Switch to "Files" tab**
- **Upload files**:
  - Drag and drop files onto the upload area
  - Or click to browse and select files
  - Supported formats: TXT, JSON, XML, PDF, CSV, Excel (.xlsx, .xls), Numbers (.numbers)
- **Parse files for translation**:
  - Click "Parse Files" button after uploading
  - Automatically extracts translatable content
  - Creates segments for translation

#### **🔍 Column Identification (NEW!)**
- **For structured files** (Excel, CSV, Numbers):
  - Click "Column Identification" button after uploading
  - Follow the 3-step wizard:
    1. **Review detected columns** with confidence scores
    2. **Map columns** to translation purposes (source, target, context, etc.)
    3. **Parse with configuration** to create segments
  - **Built-in presets** available for quick setup
  - **Smart detection** automatically suggests column types
  - **Real-time preview** shows data during configuration
- **Manage files**:
  - Download files by clicking the download icon
  - Delete files using the delete button

#### **👥 Collaboration**
- **View collaborators** in the "Collaborators" tab
- **See user roles** (Owner, Translator, Reviewer)
- **Project access** is controlled by roles

#### **🔄 Complete Translation Workflow**
1. **Create Project**: Set up project with source and target languages
2. **Upload Files**: Upload source files (TXT, JSON, XML, CSV)
3. **Parse Files**: Extract translatable content automatically
4. **Translate**: Use the AG-Grid interface for translation
5. **Review**: Mark segments for review and approval
6. **Export**: Export completed translations

### **Step 4: Test API Endpoints**

#### **Health Check**
```bash
curl http://localhost:5001/health
```

#### **Authentication Test**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'
```

#### **Project List Test**
```bash
# First get a token from login, then:
curl -X GET http://localhost:5001/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### **Segment Management Test**
```bash
# Get project segments
curl -X GET http://localhost:5001/api/segments/project/project-1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get segment statistics
curl -X GET http://localhost:5001/api/segments/project/project-1/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### **File Parsing Test**
```bash
# Parse project files
curl -X POST http://localhost:5001/api/files/parse/project-1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get supported file types
curl -X GET http://localhost:5001/api/files/supported-types \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### **Step 5: Development Features**

#### **Hot Module Replacement (HMR)**
- ✅ Frontend changes update automatically
- ✅ Backend restarts on file changes
- ✅ No need to manually refresh browser

#### **Network Access**
- **Mobile Testing**: http://192.168.0.114:3000/
- **Team Access**: Share the network URL with team members

### **🔧 Troubleshooting**

#### **Port Conflicts**
- **Backend (5001)**: If port 5001 is busy, change `PORT` in `backend/.env`
- **Frontend (3000)**: If port 3000 is busy, Vite will suggest an alternative

#### **Database Issues**
```bash
# Reset database
cd backend
npm run db:reset
npm run db:seed
```

#### **File Upload Issues**
- Check file size (max 100MB)
- Verify file type is supported
- Ensure uploads directory exists: `backend/uploads/`

### **📱 Mobile Testing**

1. **Connect to same network** as development machine
2. **Access via network IP**: http://192.168.0.114:3000/
3. **Test responsive design** on mobile devices

### **🎯 Next Steps**

#### **For Developers**
- Explore the codebase structure
- Check out the API documentation
- Review the project plan for upcoming features

#### **For Testing**
- Create test projects with different language pairs
- Upload various file types
- Test collaboration features with multiple users
- Verify role-based access control

### **📚 Additional Resources**

- **Project Plan**: `PROJECT_PLAN.md`
- **Week 2 Summary**: `PHASE_2_SUMMARY.md`
- **API Documentation**: Check backend routes
- **Database Schema**: `backend/prisma/schema.prisma`

---

## 🎉 **You're Ready!**

The application is now running and ready for development and testing. All Week 2 features are fully functional!

**Happy translating!** 🌍✨
