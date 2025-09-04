# DATEV Converter - Comprehensive Style Guide

## Overview
This style guide defines the design system for the DATEV Converter application, a financial data transformation platform built with React, TypeScript, Tailwind CSS, and shadcn/ui components.

## Design Philosophy
- **Financial App Theme**: Green-focused color palette representing growth and finance
- **Clean & Professional**: Modern, minimalist design with clear hierarchy
- **Semantic Design Tokens**: All styling uses HSL-based semantic tokens for consistency
- **Accessibility First**: WCAG compliant with proper contrast ratios and semantic HTML

---

## Color System

### Primary Colors
```css
/* Light Mode */
--primary: 158 100% 45%;        /* Bright Green #00e676 */
--primary-foreground: 0 0% 98%; /* Near White #fafafa */
--primary-muted: 158 40% 85%;   /* Light Green #bdf0d1 */
--primary-hover: 158 100% 40%;  /* Darker Green #00c968 */

/* Dark Mode */
--primary: 158 100% 45%;        /* Same Green */
--primary-foreground: 240 10% 3.9%; /* Dark Background */
--primary-muted: 158 20% 25%;   /* Dark Green #1a4d35 */
--primary-hover: 158 100% 50%;  /* Lighter Green #00ff7f */
```

### Semantic Colors
```css
/* Status Colors */
--success: 158 100% 45%;    /* Same as primary */
--warning: 45 100% 60%;     /* Orange #ffcc02 */
--destructive: 0 84.2% 60.2%; /* Red #f56565 */

/* UI Colors */
--background: 0 0% 100%;     /* White */
--foreground: 240 10% 3.9%;  /* Dark Text */
--muted: 240 4.8% 95.9%;     /* Light Gray */
--accent: 168 80% 50%;       /* Teal Green */
--border: 240 5.9% 90%;      /* Light Border */
```

### Chart Colors
```css
--chart-1: 158 100% 45%;  /* Primary Green */
--chart-2: 168 80% 50%;   /* Teal */
--chart-3: 178 60% 45%;   /* Blue-Green */
--chart-4: 43 74% 66%;    /* Yellow */
--chart-5: 27 87% 67%;    /* Orange */
```

---

## Typography

### Font Families
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace;
```

### Font Scale
- **Display**: `text-5xl md:text-7xl` (48px-96px) - Hero headlines
- **Heading 1**: `text-4xl md:text-5xl` (36px-48px) - Section headers
- **Heading 2**: `text-3xl md:text-4xl` (30px-36px) - Subsection headers
- **Heading 3**: `text-2xl` (24px) - Card titles
- **Heading 4**: `text-xl` (20px) - Component titles
- **Body Large**: `text-lg md:text-xl` (18px-20px) - Hero descriptions
- **Body**: `text-base` (16px) - Standard body text
- **Body Small**: `text-sm` (14px) - Secondary text
- **Caption**: `text-xs` (12px) - Labels and captions

### Font Weights
- **Bold**: `font-bold` (700) - Headlines and emphasis
- **Semibold**: `font-semibold` (600) - Subheadings and important text
- **Medium**: `font-medium` (500) - Labels and navigation
- **Normal**: `font-normal` (400) - Body text

---

## Spacing System

### Base Scale (using Tailwind's 4px base unit)
- **Micro**: `1` (4px) - Icon spacing
- **Small**: `2-3` (8px-12px) - Component padding
- **Medium**: `4-6` (16px-24px) - Card padding, element spacing
- **Large**: `8-12` (32px-48px) - Section spacing
- **XLarge**: `16-20` (64px-80px) - Major layout spacing
- **XXLarge**: `24-32` (96px-128px) - Hero sections

### Container Widths
- **Content**: `max-w-5xl` (1024px) - Main content width
- **Text**: `max-w-3xl` (768px) - Readable text width
- **Form Content**: `max-w-2xl` (672px) - Form containers
- **Cards**: `max-w-md` (448px) - Card components

---

## Component Patterns

### Cards
```tsx
// Standard Card Pattern
<Card className="relative overflow-hidden border-l-4 border-l-primary hover:shadow-2xl transition-all duration-500 group bg-gradient-to-br from-primary/5 to-transparent">
  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
  <CardHeader className="relative z-10">
    <CardTitle className="flex items-start gap-4 text-primary text-xl">
      <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors flex-shrink-0">
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <div className="font-bold">Title</div>
        <div className="text-sm text-muted-foreground font-normal mt-2">Subtitle</div>
      </div>
    </CardTitle>
  </CardHeader>
  <CardContent className="relative z-10">
    <p className="text-muted-foreground leading-relaxed mb-4">Content text</p>
    <div className="flex items-center gap-2 text-primary/70">
      <Icon className="h-4 w-4" />
      <span className="text-sm">Status text</span>
    </div>
  </CardContent>
</Card>
```

### Buttons
```tsx
// Primary Button
<Button className="inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200">

// Icon Button
<Button size="icon" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors">
```

### Badges
```tsx
// Status Badges
<Badge variant="outline" className="bg-success/10 text-success border-success">Success</Badge>
<Badge variant="outline" className="bg-warning/10 text-warning border-warning">Warning</Badge>
<Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">Error</Badge>
```

---

## Layout Patterns

### Page Structure
```tsx
<div className="min-h-screen bg-white">
  <Header />
  <main className="relative z-10">
    <section className="container mx-auto px-4 py-12 md:py-16">
      {/* Content */}
    </section>
  </main>
  <Footer />
</div>
```

### Section Layouts
```tsx
// Hero Section
<section className="py-20 md:py-28">
  <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
      Headline
    </h1>
    <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
      Description
    </p>
  </div>
</section>

// Content Section
<section className="bg-gradient-to-br from-primary/5 to-background py-12 md:py-16">
  <div className="container mx-auto px-4">
    <div className="max-w-6xl mx-auto space-y-16">
      {/* Content */}
    </div>
  </div>
</section>
```

---

## Animation System

### Custom Animations
```css
/* Keyframes */
@keyframes fade-in {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes slide-in-right {
  0% { transform: translateX(100%); }
  100% { transform: translateX(0); }
}

/* Animation Classes */
.animate-fade-in { animation: fade-in 0.3s ease-out; }
.animate-scale-in { animation: scale-in 0.2s ease-out; }
.animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
```

### Transition Patterns
```css
/* Smooth Transitions */
--transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Common Transition Classes */
.transition-all.duration-200    /* Fast interactions */
.transition-all.duration-300    /* Standard transitions */
.transition-all.duration-500    /* Slow, dramatic effects */
```

---

## Responsive Design

### Breakpoints
- **Mobile**: `< 768px` - Single column layouts
- **Tablet**: `768px - 1024px` - Mixed layouts with `md:` prefix
- **Desktop**: `> 1024px` - Multi-column layouts with `lg:` prefix

### Responsive Patterns
```tsx
// Text Scaling
className="text-3xl md:text-5xl"

// Layout Changes
className="grid grid-cols-1 lg:grid-cols-2"

// Spacing Adjustments
className="py-12 md:py-16"
className="px-4 md:px-6"
```

---

## Icon Usage

### Primary Icon Library
- **Lucide React**: Primary icon set
- **Size Standards**: `h-4 w-4` (16px), `h-5 w-5` (20px), `h-6 w-6` (24px), `h-7 w-7` (28px), `h-8 w-8` (32px)

### Icon Patterns
```tsx
// Standard Icon in Card
<div className="p-3 bg-primary/10 rounded-xl">
  <Icon className="h-7 w-7 text-primary" />
</div>

// Button Icon
<Button>
  <Icon className="h-5 w-5" />
  Text
</Button>

// Status Icon
<div className="flex items-center gap-2 text-primary/70">
  <Icon className="h-4 w-4" />
  <span className="text-sm">Status</span>
</div>
```

---

## Background Patterns

### Gradient Backgrounds
```css
/* Primary Gradients */
--gradient-primary: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
--gradient-subtle: linear-gradient(180deg, hsl(var(--background)), hsl(var(--muted)));

/* Section Backgrounds */
.bg-gradient-to-br.from-primary/5.to-background    /* Light primary tint */
.bg-gradient-to-br.from-destructive/5.to-background /* Light error tint */
```

### Shadow System
```css
/* Custom Shadows */
--shadow-elegant: 0 10px 30px -10px hsl(var(--primary) / 0.1);
--shadow-glow: 0 0 40px hsl(var(--primary) / 0.1);

/* Tailwind Shadow Classes */
.shadow-sm    /* Subtle elevation */
.shadow-lg    /* Card elevation */
.shadow-xl    /* Prominent elevation */
.shadow-2xl   /* Maximum elevation */
```

---

## Form Components

### Input Styling
```tsx
<Input className="w-full border-border focus:border-primary focus:ring-2 focus:ring-primary/20" />
```

### Form Layout
```tsx
<div className="space-y-6">
  <div className="space-y-2">
    <Label className="text-sm font-medium">Label</Label>
    <Input />
    <p className="text-xs text-muted-foreground">Helper text</p>
  </div>
</div>
```

---

## Data Display

### Tables
```tsx
<Table>
  <TableHeader>
    <TableRow className="border-b border-border">
      <TableHead className="font-medium text-muted-foreground">Header</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="border-b border-border/50 hover:bg-muted/50">
      <TableCell className="font-medium">Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Loading States
```tsx
// Skeleton Pattern
<div className="animate-pulse">
  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-muted rounded w-1/2"></div>
</div>
```

---

## Best Practices

### Do's ✅
- Use semantic color tokens (e.g., `text-primary` not `text-green-500`)
- Maintain consistent spacing with the 4px base unit
- Use hover states for interactive elements
- Apply proper focus states for accessibility
- Use gradients and shadows sparingly for emphasis
- Keep animations subtle and purposeful

### Don'ts ❌
- Don't use arbitrary color values or `text-white`, `bg-white`
- Don't mix different icon libraries
- Don't create new spacing values outside the system
- Don't use animations longer than 500ms for micro-interactions
- Don't forget responsive breakpoints for text and layouts
- Don't skip semantic HTML structure

### Performance Considerations
- Use `loading="lazy"` for images below the fold
- Prefer CSS transitions over JavaScript animations
- Minimize layout shifts with consistent sizing
- Use appropriate image formats and sizes

---

## Component Composition

### Atomic Design Approach
1. **Atoms**: Basic UI elements (Button, Input, Badge)
2. **Molecules**: Simple component combinations (SearchBox, FormField)
3. **Organisms**: Complex UI sections (Header, ProductCard, DataTable)
4. **Templates**: Page layouts without content
5. **Pages**: Specific instances of templates with real content

### File Organization
```
src/
├── components/
│   ├── ui/           # Atomic components (shadcn/ui)
│   ├── layout/       # Layout components
│   ├── navigation/   # Navigation components
│   └── start-page/   # Page-specific components
├── features/         # Feature-based components
└── pages/           # Page components
```

This style guide ensures consistency across the entire application and provides clear guidelines for maintaining and extending the design system.