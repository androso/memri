# 🌱 Ghibli Memories - Photo Album

A whimsical, Studio Ghibli-inspired photo album web application with an enchanting design and essential photo management features.

![Ghibli Memories](https://images.unsplash.com/photo-1503803548695-c2a7b4a5b875?auto=format&w=800)

## ✨ Features

- **Magical Visual Design**: Hand-drawn styles, watercolor overlays, and a soothing color palette inspired by Studio Ghibli films
- **Photo Collections**: Organize photos into customizable collections (Nature, Travels, Favorites, and custom categories)
- **Photo Management**: Upload, view, like, and organize your photos
- **Responsive Layout**: Beautiful experience on all devices from mobile to desktop
- **Intuitive Interface**: Simple and easy-to-use UI with whimsical animations

## 🎨 Design Elements

The application features a carefully crafted aesthetic with:

- Soft, pastel color palette reminiscent of Ghibli films
- Hand-drawn UI elements with imperfect borders
- Gentle animations and hover effects
- Watercolor textures and overlays
- Custom typography with Quicksand and Lato fonts

## 🔧 Technical Stack

- **Frontend**: React with TypeScript
- **Backend**: Express.js server
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for data fetching
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Custom components with Shadcn/UI and Radix UI primitives
- **Styling**: Tailwind CSS
- **File Uploads**: Multer for handling image uploads
- **Data Storage**: In-memory storage (can be extended to use PostgreSQL)

## 📊 Data Model

The application uses a simple but effective data model:

- **Users**: Account information (demonstration only)
- **Collections**: Groups of photos with types (nature, travels, favorites, custom)
- **Photos**: Image files with metadata, collection assignment, and like status

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ghibli-memories.git
   cd ghibli-memories
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## 📱 Application Features

### Photo Upload

- Upload images through an intuitive modal
- Add titles and descriptions
- Assign to collections

### Photo Management

- View photos in a responsive grid layout
- Like/unlike photos
- Filter by collection
- Search by title or description
- Sort by date or name

### Collections

- Create custom collections
- Assign photos to collections
- View photos by collection

## 🔍 Project Structure

```
├── client/                 # Frontend code
│   ├── src/
│   │   ├── assets/         # Static assets
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and constants
│   │   ├── pages/          # Page components
│   │   └── styles/         # CSS styles
├── server/                 # Backend code
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data storage implementation
│   └── vite.ts             # Vite server setup
├── shared/                 # Shared code
│   └── schema.ts           # Data models and schemas
└── uploads/                # Uploaded photos directory
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Inspired by the magical worlds created by Studio Ghibli
- Photo assets from Unsplash contributors
- Built with React, Express, and modern web technologies