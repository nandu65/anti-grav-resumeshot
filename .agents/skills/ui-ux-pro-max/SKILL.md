---
name: ui-ux-pro-max
description: AI-powered UI/UX design intelligence toolkit providing searchable design systems, styles (glassmorphism, brutalism, minimalism), color palettes, font pairings, chart choices, GSAP animations, and UX guidelines. Use to generate high-converting, aesthetic web app and SaaS interfaces.
---

# UI UX Pro Max Skill

AI-powered UI/UX design intelligence toolkit providing searchable databases of UI styles, color palettes, font pairings, chart types, animations, and UX guidelines.

## Quick CLI Search

Run the search engine directly from python:

```powershell
python skills/ui-ux-pro-max/src/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain> [-n <max_results>]
```

### Supported Search Domains
- `product` - Product type recommendations (Resume Builder, SaaS, E-commerce, Portfolio, Dashboard)
- `style` - UI styles (Glassmorphism, Swiss Minimalist, Neumorphism, Dark Mode, Cyberpunk)
- `color` - Curated harmonious color palettes by industry/product
- `typography` - Font pairings with Google Fonts import URLs
- `landing` - Landing page patterns, conversion sections, and CTA layouts
- `chart` - Data visualizations and library choices
- `ux` - UX best practices, accessibility standards, and anti-patterns
- `icons` - Icon library recommendations (Lucide, Heroicons, Phosphor)
- `react` / `shadcn` - Component layout guidelines and token integration
- `gsap` - Animation patterns and micro-interactions

## Usage Example

Generate design system recommendations for SaaS:
```powershell
python skills/ui-ux-pro-max/src/ui-ux-pro-max/scripts/search.py "resume builder" --design-system --motion 8 --density 7
```
