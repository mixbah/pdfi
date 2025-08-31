# Document Summary Assistant

An intelligent document processing application that extracts text from PDFs and images, then generates comprehensive summaries using AI technology.

## Features

- **Multi-format Document Upload**: Support for PDF files and image documents (JPG, PNG, JPEG)
- **Drag & Drop Interface**: Intuitive file upload with visual feedback
- **Smart Text Extraction**: PDF parsing and OCR for scanned documents
- **AI-Powered Summaries**: Generate summaries in three lengths (short, medium, long)
- **Document History**: Track and manage previously processed documents
- **Mobile Responsive**: Optimized for all device sizes
- **Dark Theme**: Modern, professional interface design

## Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Database**: MongoDB for document history storage
- **AI Integration**: Google Gemini AI for intelligent summarization
- **File Processing**: PDF parsing and OCR capabilities
- **Deployment**: Vercel for hosting and scalability

## Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB database (local or cloud)
- Google Gemini AI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mixbah/PDFI-SUMMARY.git
cd PDFI-SUMMARY
```

2. Install dependencies:
```bash
npm --force install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your configuration:
```env
MONGODB_URI=your_mongodb_connection_string
GOOGLE_API_KEY=your_gemini_api_key
NEXTAUTH_SECRET=your_secret_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Upload Document**: Drag and drop or click to select PDF/image files
2. **Choose Summary Length**: Select short, medium, or long summary option
3. **Process**: Click "Generate Summary" to extract text and create summary
4. **Review Results**: View extracted text and AI-generated summary
5. **Access History**: Browse previously processed documents

## API Endpoints

### POST `/api/process-document`
Process uploaded documents and generate summaries.

**Request**: Multipart form data with file and summary length
**Response**: Extracted text, summary, and processing metadata

### GET `/api/history`
Retrieve user's document processing history.

**Response**: Array of processed documents with summaries

### DELETE `/api/history`
Clear all document history.

## Project Architecture

The application follows a clean architecture pattern:

- **Components**: Reusable UI components with TypeScript
- **API Routes**: Server-side document processing endpoints
- **Database Layer**: MongoDB integration for data persistence
- **AI Integration**: Google Gemini for intelligent text summarization
- **File Processing**: Multi-format document handling with error management

## Development Approach

This project was built with focus on:

1. **User Experience**: Intuitive interface with clear feedback and loading states
2. **Code Quality**: TypeScript for type safety, modular component architecture
3. **Error Handling**: Comprehensive error management for file processing and AI integration
4. **Performance**: Optimized document processing with progress tracking
5. **Scalability**: MongoDB for data persistence and cloud-ready deployment architecture

The solution balances functionality with simplicity, ensuring robust document processing while maintaining an intuitive user interface. The modular design allows for easy feature extensions and maintenance.

## Deployment

The application is deployed on Vercel with automatic deployments from the main branch. Database is hosted on MongoDB Atlas for reliability and scalability.

**Live Demo**: [Your Deployed URL]

## Development Timeline

- **Planning & Setup**: Project initialization and technology selection
- **Core Features**: Document upload, text extraction, and AI integration
- **UI/UX Enhancement**: Responsive design and user experience optimization
- **Testing & Deployment**: Quality assurance and production deployment

Total development time: ~8 hours

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Built using Next.js and AI technology
