# Vault Module Custom Elements Guide

This guide explains all available custom elements you can use in your Vault Library modules.

## Element Types

### 1. **heading**
Creates a heading with configurable level (1-4).

```json
{
  "type": "heading",
  "level": 1,
  "content": "Your Heading Text"
}
```

**Levels:**
- `1` = Extra Large (3xl)
- `2` = Large (2xl) - Default
- `3` = Medium (xl)
- `4` = Small (lg)

---

### 2. **paragraph**
Standard text paragraph. Supports **bold** text using double asterisks.

```json
{
  "type": "paragraph",
  "content": "This is a paragraph with **bold text** support."
}
```

**Formatting:**
- Use `**text**` for bold text
- Line breaks are preserved

---

### 3. **list**
Creates an unordered (bullet) list.

```json
{
  "type": "list",
  "items": [
    "First item",
    "Second item",
    "Third item"
  ]
}
```

---

### 4. **image**
Displays an image with optional caption.

```json
{
  "type": "image",
  "src": "https://vaultnet.work/images/your-image.png",
  "alt": "Descriptive text for the image (shown as caption)"
}
```

**Tips:**
- Upload images via the admin dashboard to get vaultnet.work URLs
- Always include `alt` text for accessibility

---

### 5. **code**
Displays code in a formatted block.

```json
{
  "type": "code",
  "language": "javascript",
  "content": "function example() {\n  return 'Hello World';\n}"
}
```

**Languages:**
- `javascript`, `python`, `html`, `css`, `json`, etc.
- Language parameter is optional

---

### 6. **quote**
Styled blockquote for quotes or callouts.

```json
{
  "type": "quote",
  "content": "Your quote text here"
}
```

**Use Cases:**
- Key insights
- Inspirational quotes
- Important callouts

---

### 7. **alert**
Alert box with different variants for different types of messages.

```json
{
  "type": "alert",
  "variant": "info",
  "content": "Your alert message here"
}
```

**Variants:**
- `info` - Informational (blue)
- `warning` - Warning (yellow/amber)
- `success` - Success (green)
- `destructive` - Error/Important (red)

**Examples:**
```json
{
  "type": "alert",
  "variant": "warning",
  "content": "⚠️ Always test your automations before deploying!"
}
```

---

### 8. **button**
Creates a clickable button that opens a URL.

```json
{
  "type": "button",
  "text": "Click Here",
  "url": "https://example.com",
  "variant": "default"
}
```

**Variants:**
- `default` - Primary button (blue)
- `destructive` - Red button for destructive actions

**Use Cases:**
- Links to external resources
- Documentation links
- Example demonstrations

---

### 9. **badge**
Small badge/label for highlighting information.

```json
{
  "type": "badge",
  "text": "New",
  "variant": "default"
}
```

**Variants:**
- `default` - Standard badge
- `destructive` - Red badge

**Use Cases:**
- Status indicators
- Categories
- Highlights

---

### 10. **separator**
Horizontal line separator for visual spacing.

```json
{
  "type": "separator"
}
```

**Use Cases:**
- Section breaks
- Visual organization
- Separating topics

---

## Complete Module Example

```json
{
  "title": "Your Module Title",
  "category": "Category Name",
  "xp_reward": 250,
  "slides": [
    {
      "id": "slide-1",
      "title": "Slide Title",
      "elements": [
        {
          "type": "heading",
          "level": 1,
          "content": "Main Title"
        },
        {
          "type": "paragraph",
          "content": "Introduction paragraph with **important** information."
        },
        {
          "type": "image",
          "src": "https://vaultnet.work/images/example.png",
          "alt": "Example diagram"
        },
        {
          "type": "alert",
          "variant": "info",
          "content": "💡 This is a helpful tip!"
        },
        {
          "type": "list",
          "items": [
            "Key point 1",
            "Key point 2",
            "Key point 3"
          ]
        },
        {
          "type": "separator"
        },
        {
          "type": "heading",
          "level": 2,
          "content": "Subsection"
        },
        {
          "type": "code",
          "language": "javascript",
          "content": "console.log('Hello World');"
        },
        {
          "type": "quote",
          "content": "An inspirational or insightful quote"
        },
        {
          "type": "button",
          "text": "Learn More",
          "url": "https://example.com"
        }
      ]
    }
  ],
  "quiz": [
    {
      "question": "Your question here?",
      "answers": [
        "Answer option 1",
        "Answer option 2",
        "Answer option 3",
        "Answer option 4"
      ],
      "correct": 0,
      "explanation": "Why this answer is correct (shown after quiz submission)"
    }
  ]
}
```

---

## Tips for Creating Modules

1. **Start with Structure**: Plan your slides and topics first
2. **Use Visual Elements**: Mix images, alerts, and separators for better engagement
3. **Keep Slides Focused**: One main topic per slide
4. **Add Context**: Use alerts for tips, warnings, and important notes
5. **Test Your JSON**: Validate JSON before pasting into admin dashboard
6. **Quiz Quality**: Make quiz questions relevant and explanations helpful

---

## Element Order Recommendations

1. **Heading** - Always start with a heading
2. **Paragraph** - Introduction or explanation
3. **Image/List** - Visual or structured content
4. **Alert** - Tips or warnings
5. **Separator** - Before new sections
6. **Code/Quote** - Examples or insights
7. **Button** - Calls to action or resources

---

## Notes

- You can use as many slides as you want
- You can use as many quiz questions as you want
- Elements are rendered in the order they appear in the array
- Images should be uploaded through the admin dashboard first
- All text supports **bold** using double asterisks

