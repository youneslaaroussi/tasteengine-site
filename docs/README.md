# GoFlyTo - AI Travel Assistant

A modern, mobile-first AI travel assistant built with Next.js 15, React 19, and Tailwind CSS. The app provides a ChatGPT-like interface for flight search and travel planning.

## 🏗️ Architecture

### Core Principles
- **Minimal State**: Leverages React hooks and context patterns to minimize component state
- **Mobile-First**: Optimized for mobile devices with touch-friendly interfaces
- **Clean Architecture**: Separation of concerns with dedicated hooks and components
- **Best Practices**: Follows React and Next.js best practices throughout

### Technology Stack
- **Next.js 15.3.5** - App Router with React Server Components
- **React 19** - Latest React with concurrent features
- **TypeScript** - Full type safety
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - High-quality component library
- **Bun** - Fast package manager and runtime

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles and design system
│   ├── layout.tsx         # Root layout with metadata
│   └── page.tsx           # Main page (just ChatInterface)
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── chat-input.tsx    # ChatGPT-like input component
│   ├── chat-interface.tsx # Main chat interface
│   ├── chat-message.tsx  # Message display component
│   └── starter-prompts.tsx # Initial prompt suggestions
├── hooks/                # Custom React hooks
│   ├── use-chat.ts       # Chat functionality hook
│   └── use-flight-search.ts # Flight search hook
├── lib/                  # Utility functions
│   └── utils.ts          # Common utilities
└── types/                # TypeScript definitions
    ├── chat.ts           # Chat-related types
    └── flights.ts        # Flight-related types
```

## 🚀 Key Features

### 1. Chat Interface
- **Streaming responses** from external AI API
- **Auto-scrolling** to new messages
- **Auto-resizing** input textarea
- **Mobile-optimized** touch interactions
- **Markdown support** in messages

### 2. Flight Search Integration
- **Progressive search** with real-time updates
- **External API integration** via environment variables
- **Minimal state management** for search results
- **Clean data flow** between chat and search

### 3. Mobile Optimization
- **Touch-friendly** interface design
- **Responsive** layout for all screen sizes
- **PWA capabilities** for app-like experience
- **Optimized scrolling** and animations

## 🔧 Environment Variables

Create a `.env.local` file:

```bash
# Backend API URL (External service)
NEXT_PUBLIC_BACKEND_URL=https://your-api-domain.com

# Optional: Google Analytics
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

## 🛠️ Development

### Prerequisites
- **Bun** (latest version)
- **Node.js** 18+ (for compatibility)

### Setup
```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build for production
bun run build

# Start production server
bun start
```

### Development Server
The app runs on `http://localhost:3001` by default (configured for non-conflicting port).

## 📱 Mobile Features

### PWA Support
- Installable on mobile devices
- Offline-capable (where applicable)
- App-like navigation and feel

### Touch Optimizations
- Proper touch targets (minimum 44px)
- Smooth scrolling and animations
- Disabled text selection on interactive elements
- Optimized focus management

## 🎨 Design System

### ChatGPT-Inspired UI
- Clean, minimal interface
- Consistent spacing and typography
- Subtle animations and transitions
- Clear visual hierarchy

### Color Scheme
- Primary: Blue (#2563eb)
- Background: White (#ffffff)
- Text: Gray scales for hierarchy
- Accents: Blue for interactive elements

## 🔄 Data Flow

### Chat Flow
1. User inputs message
2. Message sent to external API via `/agent/chat/stream`
3. Streaming response processed and displayed
4. Flight search triggered if applicable

### Flight Search Flow
1. Chat API initiates flight search
2. Frontend polls `/booking/search/{searchId}/results`
3. Progressive results update in real-time
4. Results integrated back into chat context

## 🏃‍♂️ Performance

### Optimizations
- **React.memo** for component memoization
- **useCallback** for stable function references
- **Minimal re-renders** with proper state management
- **Code splitting** with Next.js dynamic imports
- **Optimized bundle** with Bun and Turbopack

### Bundle Size
- Minimal dependencies
- Tree-shaking enabled
- Modern JavaScript output
- Optimized for Core Web Vitals

## 🚀 Deployment

### AWS Amplify
The app is configured for AWS Amplify deployment:

```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - curl -fsSL https://bun.sh/install | bash
        - source /root/.bashrc
        - bun install
    build:
      commands:
        - env | grep -e NEXT_PUBLIC_BACKEND_URL -e NEXT_PUBLIC_GA_TRACKING_ID >> .env.production
        - bun run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
```

### Environment Variables
Set these in your deployment platform:
- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_GA_TRACKING_ID` (optional)

## 🧪 Testing

### Manual Testing Checklist
- [ ] Chat input works on mobile and desktop
- [ ] Messages stream correctly
- [ ] Flight search triggers and updates
- [ ] Starter prompts work
- [ ] Auto-scroll functions properly
- [ ] Mobile touch interactions are smooth

### Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔧 Customization

### Adding New Features
1. Create hooks in `/hooks` for business logic
2. Create components in `/components` for UI
3. Update types in `/types` as needed
4. Follow existing patterns for consistency

### Styling
- Use Tailwind CSS classes
- Follow existing design patterns
- Ensure mobile responsiveness
- Test on real devices

## 📚 Best Practices Followed

### React Patterns
- ✅ Functional components with hooks
- ✅ Proper memoization with React.memo
- ✅ Stable function references with useCallback
- ✅ Minimal state and effects
- ✅ Clean component composition

### Next.js Patterns
- ✅ App Router with proper file structure
- ✅ Client/Server component separation
- ✅ Proper metadata for SEO
- ✅ Static optimization where possible

### Code Quality
- ✅ TypeScript for type safety
- ✅ Consistent naming conventions
- ✅ Clean imports and exports
- ✅ Proper error handling
- ✅ Comprehensive documentation

## 🐛 Troubleshooting

### Common Issues
1. **API Connection**: Check `NEXT_PUBLIC_BACKEND_URL` environment variable
2. **Build Errors**: Ensure Bun is properly installed
3. **Mobile Issues**: Test on real devices, not just dev tools
4. **Performance**: Check React DevTools for unnecessary re-renders

### Debug Mode
Enable additional logging by setting:
```bash
NODE_ENV=development
```

## 🤝 Contributing

1. Follow existing code patterns
2. Ensure mobile compatibility
3. Add TypeScript types for new features
4. Test on multiple devices and browsers
5. Update documentation as needed

## 📄 License

Proprietary - All rights reserved