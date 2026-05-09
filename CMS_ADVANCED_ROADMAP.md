# 🚀 CMS Advanced Enhancement Plan

**Version:** 1.0  
**Created:** May 6, 2026  
**Status:** Planning Phase  
**Estimated Timeline:** 6-8 Sprints (Sprint I - O)

---

## 📋 Executive Summary

This document outlines an ambitious roadmap to transform the Aurora F&B CMS from a basic content management system into an **enterprise-grade, feature-rich digital experience platform**. The plan is divided into strategic phases, each delivering significant value while maintaining system stability.

### Vision
> *"Transform CMS into a self-service platform where marketing teams can create compelling digital experiences without technical dependencies, while maintaining brand consistency and operational efficiency."*

### Success Metrics
- ⏱️ Reduce content publishing time by 70%
- 📈 Increase content reuse by 50%
- 🎯 Achieve 95% content approval rate without revisions
- 🌍 Support 3+ languages for international expansion
- 📊 Track 100% of content performance metrics

---

## 🎯 Strategic Priorities

### P0 - Critical (Must Have)
Features that significantly improve daily CMS operations

### P1 - High (Should Have)
Features that enhance productivity and user experience

### P2 - Medium (Nice to Have)
Features that provide competitive advantages

### P3 - Low (Future Consideration)
Features for long-term scalability

---

## 📊 Enhancement Roadmap

```
Sprint I  → Content Versioning + Workflow
Sprint J  → Media Library + Advanced Upload
Sprint K  → SEO + Analytics Integration
Sprint L  → Rich Text Editor + Page Builder
Sprint M  → Multi-language (i18n)
Sprint N  → Collaboration Tools
Sprint O  → Advanced Publishing + Optimization
```

---

## 🎬 Sprint I: Content Versioning & Approval Workflow
**Priority:** P0  
**Duration:** 2-3 weeks  
**Impact:** High - Prevents content loss, enables collaboration

### Features

#### 1. Content Versioning System
**Problem:** Currently, editing overwrites content. No history or rollback capability.

**Solution:**
- Automatic version creation on every save
- Version comparison (diff view)
- Rollback to previous versions
- Version metadata (author, timestamp, change summary)

**Technical Specs:**
```javascript
// Backend: New collection
content_versions {
  id: UUID,
  content_id: UUID,
  content_type: "brand" | "outlet" | "news" | "menu",
  version_number: number,
  data: object,  // Full snapshot of content
  author_id: UUID,
  author_name: string,
  change_summary: string,
  created_at: datetime,
  is_published: boolean
}

// API Endpoints
GET /api/admin/cms/{type}/{id}/versions
GET /api/admin/cms/{type}/{id}/versions/{version_number}
POST /api/admin/cms/{type}/{id}/versions/{version_number}/restore
GET /api/admin/cms/{type}/{id}/versions/compare?from=v1&to=v2
```

**UI Components:**
- Version history sidebar
- Diff viewer (side-by-side comparison)
- Restore confirmation dialog
- Version timeline visualization

#### 2. Approval Workflow
**Problem:** No review process before publishing content.

**Solution:**
- Multi-step approval workflow
- Role-based permissions (Creator → Reviewer → Publisher)
- Approval/rejection with comments
- Email notifications for workflow steps

**Workflow States:**
```
Draft → Pending Review → Approved → Published
   ↓         ↓             ↓
 Edit    Reject         Edit
```

**Technical Specs:**
```javascript
// Add to existing collections
{
  workflow_status: "draft" | "pending_review" | "approved" | "rejected" | "published",
  submitted_by: UUID,
  submitted_at: datetime,
  reviewed_by: UUID,
  reviewed_at: datetime,
  review_comments: string,
  published_by: UUID,
  published_at: datetime
}

// New collection: workflow_history
workflow_history {
  id: UUID,
  content_id: UUID,
  content_type: string,
  from_status: string,
  to_status: string,
  actor_id: UUID,
  actor_name: string,
  comments: string,
  created_at: datetime
}

// API Endpoints
POST /api/admin/cms/{type}/{id}/submit-for-review
POST /api/admin/cms/{type}/{id}/approve
POST /api/admin/cms/{type}/{id}/reject
GET /api/admin/cms/{type}/{id}/workflow-history
GET /api/admin/cms/pending-reviews  // For reviewers
```

**UI Components:**
- Workflow status badges
- Submit for review button
- Review modal (approve/reject + comments)
- Pending reviews dashboard
- Workflow activity timeline

#### 3. Draft Auto-Save
**Problem:** Content loss if browser crashes or connection drops.

**Solution:**
- Auto-save draft every 30 seconds
- Restore unsaved changes on page reload
- Draft conflict resolution

**Technical Specs:**
```javascript
// Local Storage pattern
localStorage.setItem(`draft_${contentType}_${id}`, JSON.stringify(formData));

// Backend endpoint
POST /api/admin/cms/{type}/{id}/autosave
GET /api/admin/cms/{type}/{id}/autosave
```

### Testing Requirements
- Version creation on edit
- Rollback functionality
- Approval workflow transitions
- Email notifications
- Draft auto-save/restore

### Acceptance Criteria
- [ ] Every content edit creates a new version
- [ ] Users can view version history with diff
- [ ] Users can rollback to any previous version
- [ ] Workflow enforces review before publish
- [ ] Reviewers receive email notifications
- [ ] Drafts auto-save every 30 seconds
- [ ] No data loss during browser crash

---

## 📁 Sprint J: Media Library & Advanced Upload
**Priority:** P0  
**Duration:** 2-3 weeks  
**Impact:** High - Centralized asset management, better performance

### Features

#### 1. Media Library Management
**Problem:** Uploaded images are scattered, no organization or reuse.

**Solution:**
- Centralized media library
- Folder/category organization
- Image metadata (title, alt text, tags)
- Search and filter media
- Media usage tracking (where is image used)

**Technical Specs:**
```javascript
// New collection: media_library
media_library {
  id: UUID,
  filename: string,
  original_filename: string,
  file_path: string,
  file_size: number,
  mime_type: string,
  width: number,
  height: number,
  title: string,
  alt_text: string,
  caption: string,
  tags: [string],
  folder_id: UUID | null,
  uploaded_by: UUID,
  uploaded_at: datetime,
  used_in: [{content_type: string, content_id: UUID}],
  views_count: number,
  deleted_at: datetime | null
}

// New collection: media_folders
media_folders {
  id: UUID,
  name: string,
  parent_id: UUID | null,
  created_at: datetime
}

// API Endpoints
GET /api/admin/cms/media/library?folder_id=&search=&tags=
POST /api/admin/cms/media/upload
PUT /api/admin/cms/media/{id}  // Update metadata
DELETE /api/admin/cms/media/{id}
GET /api/admin/cms/media/{id}/usage  // Where is this image used
POST /api/admin/cms/media/folders
GET /api/admin/cms/media/folders
```

**UI Components:**
- Media library modal (grid/list view)
- Upload dropzone with multi-file support
- Metadata editor sidebar
- Folder tree navigation
- Image preview with details
- Usage tracker (shows which content uses this image)
- Bulk actions (delete, move, tag)

#### 2. Image Processing & Optimization
**Problem:** Large images slow down website, manual resizing needed.

**Solution:**
- Auto-generate multiple sizes (thumbnail, medium, large)
- WebP conversion for modern browsers
- Image compression
- Lazy loading metadata
- Smart cropping (AI-powered focus detection)

**Technical Specs:**
```python
# Backend: Image processing service
from PIL import Image
from pillow_heif import register_heif_opener

SIZES = {
    "thumbnail": (150, 150),
    "small": (300, 300),
    "medium": (800, 800),
    "large": (1600, 1600)
}

def process_image(file_path):
    # Generate variants
    variants = {}
    for size_name, (width, height) in SIZES.items():
        # Resize
        resized = resize_image(file_path, width, height)
        # Convert to WebP
        webp_path = convert_to_webp(resized)
        variants[size_name] = {
            "url": webp_path,
            "width": ...,
            "height": ...
        }
    return variants

# Update media_library schema
{
  ...existing fields,
  variants: {
    thumbnail: {url: string, width: number, height: number},
    small: {...},
    medium: {...},
    large: {...}
  },
  optimized_size: number,  // Size after optimization
  compression_ratio: number
}
```

**Frontend Usage:**
```javascript
// Responsive image component
<ResponsiveImage
  media={mediaItem}
  size="medium"  // or "thumbnail", "large"
  alt={mediaItem.alt_text}
  loading="lazy"
/>

// Generates:
<picture>
  <source srcset="/uploads/abc-medium.webp" type="image/webp">
  <img src="/uploads/abc-medium.jpg" alt="..." loading="lazy">
</picture>
```

#### 3. Advanced Upload Features
**Problem:** Limited upload capabilities, no bulk upload.

**Solution:**
- Drag & drop multiple files
- Paste from clipboard
- Upload progress tracking
- Resume failed uploads
- Duplicate detection
- URL import (fetch from external URL)

**UI Components:**
- Multi-file upload dropzone
- Upload queue with progress bars
- Pause/resume/cancel buttons
- Duplicate warning dialog
- Batch metadata editor

### Testing Requirements
- Media library CRUD
- Multi-file upload
- Image processing (variants, WebP)
- Folder organization
- Usage tracking
- Duplicate detection

### Acceptance Criteria
- [ ] All uploaded images stored in media library
- [ ] Images organized in folders
- [ ] Auto-generate 4 size variants + WebP
- [ ] Search and filter media by tags/filename
- [ ] Track where each image is used
- [ ] Multi-file drag & drop upload
- [ ] No duplicate uploads (warn user)
- [ ] 50%+ reduction in image file sizes

---

## 🔍 Sprint K: SEO & Analytics Integration
**Priority:** P1  
**Duration:** 2 weeks  
**Impact:** Medium-High - Better search ranking, data-driven decisions

### Features

#### 1. SEO Optimization Tools
**Problem:** No SEO metadata management, poor search engine visibility.

**Solution:**
- Meta title & description editor
- URL slug management
- Open Graph tags (Facebook)
- Twitter Card tags
- Structured data (JSON-LD)
- SEO score checker
- Sitemap generation

**Technical Specs:**
```javascript
// Add to existing collections (brands, outlets, news)
{
  seo: {
    meta_title: string,  // Max 60 chars
    meta_description: string,  // Max 160 chars
    slug: string,  // URL-friendly
    og_title: string,
    og_description: string,
    og_image: string,
    twitter_card: "summary" | "summary_large_image",
    schema_type: "Restaurant" | "Article" | "Event",
    custom_schema: object,  // JSON-LD
    canonical_url: string,
    robots: "index,follow" | "noindex,nofollow"
  },
  seo_score: number  // 0-100
}

// API Endpoints
PUT /api/admin/cms/{type}/{id}/seo
GET /api/admin/cms/{type}/{id}/seo-analysis
GET /api/public/sitemap.xml
GET /api/public/robots.txt
```

**UI Components:**
- SEO panel in CMS forms
- Character count indicators
- Slug generator (auto from title)
- SEO score widget with suggestions
- Preview snippets (Google, Facebook, Twitter)

**SEO Analysis:**
```javascript
function analyzeSEO(content) {
  const checks = {
    title_length: content.seo.meta_title.length <= 60,
    description_length: content.seo.meta_description.length <= 160,
    has_slug: !!content.seo.slug,
    has_og_image: !!content.seo.og_image,
    keyword_in_title: checkKeyword(content.seo.meta_title),
    // ... more checks
  };
  
  const score = calculateScore(checks);
  const suggestions = generateSuggestions(checks);
  
  return { score, suggestions };
}
```

#### 2. Analytics Integration
**Problem:** No insights into content performance.

**Solution:**
- Page view tracking
- Click tracking (CTAs, links)
- Time on page metrics
- Popular content dashboard
- Content performance reports
- A/B testing framework

**Technical Specs:**
```javascript
// New collection: content_analytics
content_analytics {
  id: UUID,
  content_type: string,
  content_id: UUID,
  date: date,
  page_views: number,
  unique_visitors: number,
  avg_time_on_page: number,
  bounce_rate: number,
  cta_clicks: number,
  referrers: [{source: string, count: number}]
}

// Frontend: Analytics tracking
class AnalyticsTracker {
  trackPageView(contentType, contentId) {
    // Send to backend
    api.post("/analytics/track", {
      event: "page_view",
      content_type: contentType,
      content_id: contentId,
      timestamp: new Date(),
      user_agent: navigator.userAgent,
      referrer: document.referrer
    });
  }
  
  trackCTAClick(contentId, ctaLabel) {
    // Track button/link clicks
  }
}

// API Endpoints
POST /api/analytics/track
GET /api/admin/cms/analytics/overview?date_range=7d
GET /api/admin/cms/analytics/{type}/{id}?date_range=30d
GET /api/admin/cms/analytics/popular-content?limit=10
```

**UI Components:**
- Analytics dashboard in admin
- Content performance widget (views, engagement)
- Popular content report
- Referrer sources chart
- Time-based trends graph

#### 3. Content Performance Insights
**Problem:** Editors don't know which content performs well.

**Solution:**
- Performance badges (High performing, Needs update)
- Content age tracking
- Update recommendations
- Engagement metrics per content

**UI Components:**
- Performance badge in CMS list
- "Last updated X days ago" indicator
- Suggested updates notification
- Quick stats cards (views, clicks, engagement)

### Testing Requirements
- Meta tag generation
- Sitemap generation
- Analytics tracking
- SEO score calculation
- Performance insights

### Acceptance Criteria
- [ ] All content has SEO metadata
- [ ] Auto-generate sitemap.xml
- [ ] SEO score for each content piece
- [ ] Track page views and engagement
- [ ] Popular content dashboard
- [ ] Performance recommendations
- [ ] Open Graph preview working

---

## ✍️ Sprint L: Rich Text Editor & Page Builder
**Priority:** P1  
**Duration:** 3-4 weeks  
**Impact:** High - Empowers non-technical users

### Features

#### 1. Rich Text Editor (WYSIWYG)
**Problem:** Plain text fields limit content formatting.

**Solution:**
- WYSIWYG editor for news content
- Text formatting (bold, italic, lists, headings)
- Link insertion
- Image embedding (from media library)
- Video embedding (YouTube, Vimeo)
- Code block support
- Table support
- Undo/redo

**Technical Implementation:**
```javascript
// Use TipTap or Quill.js
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

const editor = useEditor({
  extensions: [
    StarterKit,
    Image,
    Link,
    // Custom extensions
  ],
  content: initialContent,
  onUpdate: ({ editor }) => {
    const html = editor.getHTML();
    const json = editor.getJSON();
    // Save to backend
  }
});

// Store as HTML + JSON for flexibility
{
  content_html: string,  // For rendering
  content_json: object,  // For editing
}
```

**Features:**
- Toolbar with formatting options
- Keyboard shortcuts (Ctrl+B, Ctrl+I)
- Markdown support
- Media library integration
- Link management
- Responsive preview

#### 2. Flexible Content Blocks
**Problem:** Fixed content structure limits creativity.

**Solution:**
- Block-based content system
- Pre-defined block types (text, image, gallery, video, quote, CTA)
- Drag & drop reordering
- Block templates
- Reusable blocks

**Technical Specs:**
```javascript
// New schema for flexible content
flexible_content {
  id: UUID,
  content_id: UUID,
  content_type: string,
  blocks: [
    {
      id: UUID,
      type: "text" | "image" | "gallery" | "video" | "quote" | "cta" | "menu_showcase",
      order: number,
      data: object,  // Block-specific data
      settings: {
        background_color: string,
        padding: string,
        alignment: string
      }
    }
  ]
}

// Example blocks
{
  type: "text",
  data: {
    content_html: "<p>Rich text content...</p>",
    text_align: "left"
  }
}

{
  type: "image",
  data: {
    media_id: UUID,
    caption: string,
    size: "full" | "medium" | "thumbnail",
    link_url: string
  }
}

{
  type: "gallery",
  data: {
    media_ids: [UUID],
    layout: "grid" | "masonry" | "carousel"
  }
}

{
  type: "cta",
  data: {
    title: string,
    description: string,
    button_text: string,
    button_link: string,
    style: "primary" | "secondary"
  }
}
```

**UI Components:**
- Block selector dropdown
- Drag handles for reordering
- Block toolbar (move up/down, duplicate, delete)
- Block settings sidebar
- Preview mode
- Block templates library

#### 3. Landing Page Builder
**Problem:** Creating special event/promo pages requires developer.

**Solution:**
- Visual page builder
- Pre-made templates (Event, Menu Launch, Promotion)
- Section library
- Custom CSS/JS injection (for advanced users)
- Responsive preview

**Technical Specs:**
```javascript
// New collection: custom_pages
custom_pages {
  id: UUID,
  slug: string,
  title: string,
  template: string,
  blocks: [...],  // Same as flexible content
  seo: {...},
  published: boolean,
  published_at: datetime,
  expires_at: datetime | null,  // Auto-unpublish
  created_by: UUID,
  created_at: datetime
}

// Frontend routing
// /pages/:slug → Render custom page
```

**Templates:**
- Event page (date, location, RSVP)
- Menu launch (hero, menu items, outlets)
- Promotion (countdown timer, T&C, CTA)
- About page (team, timeline, values)

### Testing Requirements
- Rich text editing
- Block CRUD operations
- Drag & drop reordering
- Page builder functionality
- Template rendering
- Responsive preview

### Acceptance Criteria
- [ ] WYSIWYG editor for news content
- [ ] 6+ block types available
- [ ] Drag & drop block reordering
- [ ] 3+ page templates
- [ ] Custom page creation without code
- [ ] Responsive preview for all devices
- [ ] Save and restore drafts

---

## 🌍 Sprint M: Multi-language Support (i18n)
**Priority:** P1  
**Duration:** 2-3 weeks  
**Impact:** High - International expansion ready

### Features

#### 1. Multi-language Content Management
**Problem:** Single language limits international expansion.

**Solution:**
- Support multiple languages (EN, ID, ZH)
- Language switcher on public website
- Translation management in admin
- Fallback to default language
- Per-field translation status

**Technical Specs:**
```javascript
// Add to all content collections
{
  default_language: "id",
  translations: {
    id: {  // Indonesian (default)
      name: "Altero",
      tagline: "Specialty Coffee & All-Day Dining",
      short_desc: "Tempat di mana...",
      story: "Altero lahir dari..."
    },
    en: {  // English
      name: "Altero",
      tagline: "Specialty Coffee & All-Day Dining",
      short_desc: "A place where...",
      story: "Altero was born from...",
      translation_status: "complete" | "partial" | "missing",
      translated_by: UUID,
      translated_at: datetime
    },
    zh: {  // Chinese
      name: "阿尔特罗",
      tagline: "特色咖啡与全日餐饮",
      // ...
    }
  }
}

// System-wide i18n config
i18n_config {
  supported_languages: ["id", "en", "zh"],
  default_language: "id",
  fallback_language: "en"
}

// API Endpoints
GET /api/public/brands?lang=en
GET /api/admin/cms/brands/{id}/translations
PUT /api/admin/cms/brands/{id}/translations/{lang}
POST /api/admin/cms/translations/auto-translate  // AI translation
GET /api/admin/cms/translations/progress  // Translation completion %
```

**UI Components:**
- Language tabs in CMS forms
- Translation status indicators
- "Copy from default language" button
- Translation progress bar
- Language switcher on public website
- Missing translations warning

#### 2. Auto-Translation (AI-Powered)
**Problem:** Manual translation is time-consuming.

**Solution:**
- AI-powered auto-translation (OpenAI)
- Human review before publish
- Translation memory (reuse translations)
- Glossary for brand terms

**Technical Implementation:**
```python
# Backend: Translation service
async def auto_translate(text: str, from_lang: str, to_lang: str):
    # Use OpenAI for high-quality translation
    prompt = f"""
    Translate the following {from_lang} text to {to_lang}.
    This is content for a restaurant website.
    Maintain the tone and style.
    
    Text: {text}
    """
    
    response = await openai_client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.choices[0].message.content

# API Endpoint
POST /api/admin/cms/translations/auto-translate
{
  "content_id": "...",
  "content_type": "brand",
  "from_lang": "id",
  "to_lang": "en",
  "fields": ["tagline", "short_desc", "story"]
}
```

**UI Components:**
- "Auto-translate" button per field
- Translation review interface
- Glossary manager
- Bulk translate action

#### 3. Localization Features
**Problem:** Translation alone isn't enough - need cultural adaptation.

**Solution:**
- Date/time format per locale
- Currency display
- Number formatting
- Right-to-left (RTL) support preparation
- Locale-specific images

**Implementation:**
```javascript
// Frontend: Use i18next or react-intl
import { useTranslation } from 'react-i18next';

function Component() {
  const { t, i18n } = useTranslation();
  
  return (
    <div dir={i18n.dir()}>
      <h1>{t('brands.tagline')}</h1>
      <p>{t('brands.description')}</p>
      <Price value={price} currency="IDR" locale={i18n.language} />
    </div>
  );
}

// Date formatting
const date = new Date();
const formatted = new Intl.DateTimeFormat(locale).format(date);
```

### Testing Requirements
- Multi-language content creation
- Language switching
- Auto-translation
- Fallback behavior
- Locale-specific formatting

### Acceptance Criteria
- [ ] Support 3 languages (ID, EN, ZH)
- [ ] Language switcher on public website
- [ ] Translation management in admin
- [ ] Auto-translate feature working
- [ ] Translation progress tracking
- [ ] Fallback to default language
- [ ] Locale-specific date/currency format

---

## 🤝 Sprint N: Collaboration Tools
**Priority:** P2  
**Duration:** 2 weeks  
**Impact:** Medium - Better teamwork

### Features

#### 1. Comments & Annotations
**Problem:** Feedback given via email/chat, not contextual.

**Solution:**
- Add comments to content drafts
- Thread-based discussions
- @mentions for team members
- Resolve/unresolve comments
- Comment notifications

**Technical Specs:**
```javascript
// New collection: content_comments
content_comments {
  id: UUID,
  content_id: UUID,
  content_type: string,
  author_id: UUID,
  author_name: string,
  comment: string,
  parent_id: UUID | null,  // For threading
  mentions: [UUID],
  resolved: boolean,
  resolved_by: UUID,
  resolved_at: datetime,
  created_at: datetime
}

// API Endpoints
GET /api/admin/cms/{type}/{id}/comments
POST /api/admin/cms/{type}/{id}/comments
PUT /api/admin/cms/comments/{id}
DELETE /api/admin/cms/comments/{id}
POST /api/admin/cms/comments/{id}/resolve
```

**UI Components:**
- Comments sidebar
- Thread view
- @mention autocomplete
- Resolve button
- Notification bell

#### 2. User Activity Log
**Problem:** Can't track who changed what.

**Solution:**
- Comprehensive activity log
- Filter by user, action, date
- Export activity report

**Technical Specs:**
```javascript
// New collection: user_activity
user_activity {
  id: UUID,
  user_id: UUID,
  user_name: string,
  action: "create" | "update" | "delete" | "publish" | "approve" | "reject",
  content_type: string,
  content_id: UUID,
  content_title: string,
  changes: object,  // What changed
  ip_address: string,
  user_agent: string,
  created_at: datetime
}

// API Endpoints
GET /api/admin/cms/activity?user_id=&action=&date_from=&date_to=
GET /api/admin/cms/activity/export?format=csv
```

**UI Components:**
- Activity log page
- Filter controls
- Activity timeline
- Export button

#### 3. Content Locking
**Problem:** Multiple users editing same content causes conflicts.

**Solution:**
- Lock content when user starts editing
- Show "Currently editing by X" warning
- Auto-release lock after inactivity
- Force unlock (admin only)

**Technical Implementation:**
```javascript
// Add to content documents
{
  locked_by: UUID | null,
  locked_at: datetime | null,
  lock_expires_at: datetime | null
}

// Backend: Lock management
@router.post("/api/admin/cms/{type}/{id}/lock")
async def lock_content(content_id: str, user: dict):
    # Check if already locked
    # Set lock with 30min expiration
    
@router.delete("/api/admin/cms/{type}/{id}/lock")
async def unlock_content(content_id: str, user: dict):
    # Release lock

// Frontend: Auto lock/unlock
useEffect(() => {
  // Lock on mount
  lockContent(contentId);
  
  // Heartbeat every 5 min to extend lock
  const interval = setInterval(() => {
    extendLock(contentId);
  }, 5 * 60 * 1000);
  
  // Unlock on unmount
  return () => {
    clearInterval(interval);
    unlockContent(contentId);
  };
}, [contentId]);
```

**UI Components:**
- Lock status indicator
- "Currently editing" banner
- Force unlock button (admin)

### Testing Requirements
- Comment CRUD
- Threading and mentions
- Activity logging
- Content locking
- Lock expiration

### Acceptance Criteria
- [ ] Add comments to drafts
- [ ] @mention team members
- [ ] Activity log tracks all changes
- [ ] Content locks when editing
- [ ] Auto-unlock after 30min inactivity
- [ ] Admins can force unlock

---

## 📅 Sprint O: Advanced Publishing & Optimization
**Priority:** P2  
**Duration:** 2-3 weeks  
**Impact:** Medium - Automation & performance

### Features

#### 1. Scheduled Publishing
**Problem:** Need to publish content at specific times.

**Solution:**
- Schedule publish date/time
- Schedule unpublish date/time
- Recurring content (monthly menu updates)
- Publish queue management

**Technical Specs:**
```javascript
// Add to content documents
{
  scheduled_publish_at: datetime | null,
  scheduled_unpublish_at: datetime | null,
  is_recurring: boolean,
  recurrence_rule: string,  // RRULE format
  auto_published: boolean
}

// Backend: Scheduler service (cron job)
@scheduler.scheduled_job("interval", minutes=5)
async def process_scheduled_content():
    now = datetime.now(timezone.utc)
    
    # Publish scheduled content
    to_publish = await db.collection.find({
        "scheduled_publish_at": {"$lte": now},
        "status": "approved",
        "auto_published": False
    }).to_list()
    
    for item in to_publish:
        item["status"] = "published"
        item["published_at"] = now
        item["auto_published"] = True
        await db.collection.update_one({"id": item["id"]}, {"$set": item})
    
    # Unpublish expired content
    to_unpublish = await db.collection.find({
        "scheduled_unpublish_at": {"$lte": now},
        "status": "published"
    }).to_list()
    
    for item in to_unpublish:
        item["status"] = "draft"
        await db.collection.update_one({"id": item["id"]}, {"$set": item})

// API Endpoints
GET /api/admin/cms/scheduled?type=publish|unpublish
POST /api/admin/cms/{type}/{id}/schedule
DELETE /api/admin/cms/{type}/{id}/schedule
```

**UI Components:**
- Date/time picker for scheduling
- Scheduled content calendar view
- Publish queue table
- Cancel schedule button

#### 2. Content Templates
**Problem:** Recreating similar content is repetitive.

**Solution:**
- Save content as template
- Template library
- Quick create from template
- Template categories

**Technical Specs:**
```javascript
// New collection: content_templates
content_templates {
  id: UUID,
  name: string,
  description: string,
  content_type: string,
  template_data: object,  // Content structure
  category: string,
  thumbnail: string,
  created_by: UUID,
  is_system: boolean,  // Pre-built vs user-created
  usage_count: number,
  created_at: datetime
}

// API Endpoints
GET /api/admin/cms/templates?content_type=&category=
POST /api/admin/cms/templates
POST /api/admin/cms/templates/{id}/create-from
DELETE /api/admin/cms/templates/{id}
```

**Pre-built Templates:**
- "New Menu Launch" (news template)
- "Outlet Opening" (news template)
- "Seasonal Menu" (menu template)
- "Event Announcement" (news template)

**UI Components:**
- Templates gallery
- "Save as template" button
- "Use template" dropdown in create form
- Template preview

#### 3. Bulk Operations
**Problem:** Updating multiple items is tedious.

**Solution:**
- Bulk select in CMS tables
- Bulk actions (publish, unpublish, delete, tag)
- Bulk edit (update common fields)
- Bulk import/export (CSV)

**Technical Specs:**
```javascript
// API Endpoints
POST /api/admin/cms/{type}/bulk-action
{
  "action": "publish" | "unpublish" | "delete" | "tag" | "update",
  "ids": [UUID],
  "data": object  // For update/tag actions
}

POST /api/admin/cms/{type}/bulk-import
// Accept CSV file

GET /api/admin/cms/{type}/export?format=csv
```

**UI Components:**
- Checkbox column in tables
- "Select all" checkbox
- Bulk action dropdown
- Import CSV button
- Export to CSV button
- Bulk edit modal

#### 4. Performance Optimization
**Problem:** Public website can be slow with many images.

**Solution:**
- Static page generation (SSG) for content
- CDN integration (Cloudflare)
- Image lazy loading
- Caching strategy
- Preload critical assets

**Technical Implementation:**
```javascript
// Frontend: Static generation
export async function getStaticPaths() {
  const brands = await api.get("/public/brands");
  return brands.map(brand => ({
    params: { brandId: brand.id }
  }));
}

export async function getStaticProps({ params }) {
  const brand = await api.get(`/public/brands/${params.brandId}`);
  return { props: { brand }, revalidate: 3600 };  // Revalidate every hour
}

// Lazy loading
<img
  src={image.url}
  loading="lazy"
  decoding="async"
/>

// Intersection Observer for custom lazy load
const LazyImage = ({ src, alt }) => {
  const ref = useRef();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    });
    
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  
  return (
    <img ref={ref} src={isVisible ? src : placeholder} alt={alt} />
  );
};

// Backend: Cache headers
@router.get("/public/brands")
async def get_brands():
    brands = await fetch_brands()
    return Response(
        content=json.dumps(ok_envelope(brands)),
        media_type="application/json",
        headers={
            "Cache-Control": "public, max-age=3600",
            "ETag": generate_etag(brands)
        }
    )
```

**Caching Strategy:**
- Browser cache: 1 hour for content, 1 day for images
- CDN cache: 1 hour for HTML, 1 week for static assets
- Database query cache: 5 minutes for listings

### Testing Requirements
- Scheduled publishing
- Template creation and usage
- Bulk operations
- Performance metrics
- Cache invalidation

### Acceptance Criteria
- [ ] Schedule content publish/unpublish
- [ ] 5+ pre-built templates
- [ ] Save custom templates
- [ ] Bulk select and edit
- [ ] Import/export CSV
- [ ] Page load time <2 seconds
- [ ] Images lazy load
- [ ] CDN integration working

---

## 🔧 Technical Architecture Updates

### Database Changes Summary
```javascript
// New Collections
- content_versions
- workflow_history
- media_library
- media_folders
- content_analytics
- flexible_content
- custom_pages
- i18n_config
- content_comments
- user_activity
- content_templates

// Updated Collections (add fields to existing)
- public_brands, public_outlets, public_news, public_menu_items
  + workflow_status, reviewed_by, published_by
  + seo {meta_title, meta_description, slug, ...}
  + translations {id: {...}, en: {...}, zh: {...}}
  + scheduled_publish_at, scheduled_unpublish_at
  + locked_by, locked_at
  + seo_score, views_count
```

### API Architecture
```
Current: RESTful JSON API
Future considerations:
- GraphQL for flexible queries
- Webhooks for integrations
- WebSocket for real-time collaboration
```

### Performance Targets
```
Metric                    Current    Target (After Sprint O)
-----------------------------------------------------------
Page Load Time            3-4s       <2s
Time to First Byte        800ms      <400ms
Image Load Time           2s         <1s
API Response Time         150ms      <100ms
Database Query Time       50ms       <30ms
```

### Security Enhancements
```
- Rate limiting per user/IP
- Content Security Policy (CSP)
- CSRF protection for CMS forms
- XSS sanitization for rich text
- File upload validation
- SQL injection prevention (already handled by MongoDB)
```

---

## 📊 Success Metrics & KPIs

### Sprint I Success Metrics
- [ ] 100% of content edits versioned
- [ ] 0% content loss incidents
- [ ] 90%+ approval rate on first review
- [ ] Average review time <24 hours

### Sprint J Success Metrics
- [ ] 100% of images in media library
- [ ] 50%+ reduction in image sizes
- [ ] 80%+ image reuse rate
- [ ] Upload time <5 seconds per image

### Sprint K Success Metrics
- [ ] 80+ SEO score on all content
- [ ] 100% content has meta descriptions
- [ ] 2x increase in organic search traffic
- [ ] Track 100% of page views

### Sprint L Success Metrics
- [ ] 90% of editors prefer WYSIWYG
- [ ] 3+ custom pages created without dev help
- [ ] 70% reduction in content creation time

### Sprint M Success Metrics
- [ ] Support 3 languages
- [ ] 80%+ translation completion rate
- [ ] Enable international expansion
- [ ] <1 minute to switch languages

### Sprint N Success Metrics
- [ ] 50% reduction in email feedback
- [ ] 100% activity tracked
- [ ] Zero editing conflicts
- [ ] 90%+ comments resolved

### Sprint O Success Metrics
- [ ] 50% content scheduled vs manual
- [ ] 10+ templates in library
- [ ] Page load time <2 seconds
- [ ] 5+ bulk operations per week

---

## 🎓 Training & Documentation Needs

### User Documentation
- [ ] CMS user guide (PDF/video)
- [ ] WYSIWYG editor tutorial
- [ ] SEO best practices guide
- [ ] Media library usage guide
- [ ] Translation workflow guide

### Technical Documentation
- [ ] API documentation update
- [ ] Architecture decision records (ADRs)
- [ ] Database migration guides
- [ ] Performance optimization guide
- [ ] Security guidelines

### Training Plan
- Week 1: Version control & workflow
- Week 2: Media library & optimization
- Week 3: SEO & analytics
- Week 4: Rich text & page builder
- Week 5: Multi-language management

---

## 💰 Estimated Resource Requirements

### Development Time
```
Sprint I:  120-160 hours (2-3 weeks)
Sprint J:  120-160 hours (2-3 weeks)
Sprint K:  80-120 hours (2 weeks)
Sprint L:  160-200 hours (3-4 weeks)
Sprint M:  120-160 hours (2-3 weeks)
Sprint N:  80-120 hours (2 weeks)
Sprint O:  120-160 hours (2-3 weeks)
-------------------------------------------
Total:     800-1080 hours (16-22 weeks)
```

### External Services (Monthly Costs)
```
- CDN (Cloudflare): $20-200
- OpenAI API (translations): $50-500
- Image optimization service: $0-100
- Analytics platform: $0-50
- Email service (notifications): $0-30
-------------------------------------------
Estimated: $70-880/month
```

### Infrastructure
```
- Additional storage for media: +50-100GB
- Increased bandwidth for CDN
- Redis for caching (optional)
- Elasticsearch for search (optional)
```

---

## 🚀 Quick Start Implementation Order

**If resources are limited, prioritize in this order:**

1. **Sprint I (Versioning + Workflow)** - Critical for data safety
2. **Sprint J (Media Library)** - High impact, immediate value
3. **Sprint K (SEO)** - Business value, search visibility
4. **Sprint L (Rich Text)** - User experience improvement
5. **Sprint O (Optimization)** - Performance & automation
6. **Sprint M (i18n)** - When international expansion needed
7. **Sprint N (Collaboration)** - For larger teams

---

## 📋 Pre-Implementation Checklist

Before starting any sprint:
- [ ] Review current system status
- [ ] Ensure all previous sprints are stable
- [ ] Backup database
- [ ] Update documentation
- [ ] Communicate timeline to stakeholders
- [ ] Prepare test data
- [ ] Set up monitoring

---

## 🤝 Stakeholder Communication Plan

### Weekly Updates
- Progress report
- Demo of completed features
- Blockers and risks
- Next week's goals

### Monthly Reviews
- Sprint retrospective
- Performance metrics
- User feedback summary
- Roadmap adjustments

### Launch Communications
- Feature announcement
- Training sessions
- User guides distribution
- Feedback collection

---

## 📞 Support & Maintenance

### Post-Launch Support
- Monitor error rates
- Collect user feedback
- Quick bug fixes
- Performance tuning
- Feature refinements

### Ongoing Maintenance
- Weekly: Security updates
- Monthly: Performance review
- Quarterly: Feature assessment
- Yearly: Major version planning

---

## 🎯 Final Note

This plan is **ambitious but achievable**. Each sprint builds on the previous, creating a **world-class CMS** that:

- ✅ Empowers non-technical users
- ✅ Scales with business growth
- ✅ Maintains brand consistency
- ✅ Drives measurable results
- ✅ Supports international expansion

**Remember:** Start with Sprint I and J (foundational), then adapt based on user feedback and business priorities.

---

**Document Version:** 1.0  
**Next Review:** After Sprint I completion  
**Owner:** Product & Engineering Team  

For questions or clarifications, refer to:
- `/app/AI_DEVELOPMENT_RULES.md` - Development guidelines
- `/app/CURRENT_STATUS.md` - Current system state
- `/app/memory/ARCHITECTURE.md` - Technical architecture
