# Books, Groceries & Health Persistence Guide

## Overview
Your dashboard now has full persistence for Books, Groceries, and Health logs directly to Google Sheets.

## Setup (First Time Only)

1. **Deploy the updated Apps Script:**
   - Open your Apps Script project
   - Run the `setupSheets()` function from the editor
   - This creates all 4 new sheets automatically

2. **Redeploy as Web App:**
   - Click "Deploy" → "New Deployment"
   - Select "Web App"
   - Keep all permissions the same
   - Copy the new deployment URL
   - Update your HTML file's API endpoint (if needed)

## Data Structure

### Books Sheet
Stores your book collection with metadata:
- `id` - Unique identifier
- `title` - Book title
- `author` - Author name
- `cover` - Cover image URL
- `progress` - Pages read (number)
- `rating` - Your rating (1-5)
- `status` - Reading status (reading/completed/dropped)
- `genre` - Book genre
- `createdAt` - When added to dashboard
- `updatedAt` - Last modification
- `notes` - Your notes
- `imageUrl` - Poster/cover image URL

### Books Queue Sheet
Stores your reading wishlist:
- `id` - Unique identifier
- `title` - Book title
- `author` - Author name
- `genre` - Book genre
- `priority` - Priority level (1-5)
- `addedAt` - When added to queue
- `notes` - Notes about why you want to read it

### Groceries Sheet
Stores grocery items and shopping list:
- `id` - Unique identifier
- `item` - Item name
- `location` - Store/aisle location
- `category` - Category (Produce, Dairy, etc)
- `quantity` - Amount needed
- `unit` - Unit of measurement
- `priority` - Priority level
- `purchased` - TRUE/FALSE
- `createdAt` - When added
- `updatedAt` - Last modified
- `notes` - Notes about item

### Health Logs Sheet
Stores health metrics and observations:
- `id` - Unique identifier
- `date` - Date of measurement
- `metric` - What you measured (weight, steps, calories, etc)
- `value` - The measured value
- `unit` - Unit of measurement (kg, steps, kcal, etc)
- `category` - Category (fitness, nutrition, biometrics, etc)
- `notes` - Additional notes
- `createdAt` - When logged

## Frontend Integration

Your HTML dashboard is already configured to save/load from these sheets.

### Auto-save behavior:
- **Books**: Saves on update, rating change, or status change
- **Groceries**: Saves when adding items or marking purchased
- **Health**: Saves when logging new metrics

### Data sync:
```javascript
// Frontend loads all data on page load
const data = await fetch('/api/data').then(r => r.json());

// Saves changes back
await fetch('/api/save', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

## Diagnostic Tools

### Run Data Scan
Check for incomplete entries (missing required fields):

```javascript
// In Apps Script editor: Run → scanMissingData()
function scanMissingData()
```

This will alert you with a report of:
- Books missing title/author/cover
- Groceries missing location/category
- Health logs missing date/metric
- Other incomplete entries

### Count Missing Data
Get a count of items needing attention:

```javascript
// Returns number of incomplete items
const missingCount = countMissingData();
```

## Common Tasks

### Adding a Book
1. Fill in Book form in dashboard
2. Required fields: title, author, cover image
3. Auto-saves to Books sheet
4. Shows in your carousel

### Moving Book to Queue
1. Click "To Read Next" button
2. Fills in as new queue item
3. Auto-saves to Books Queue sheet

### Managing Grocery List
1. Add items with location and category
2. Location = store aisle or store name
3. Mark purchased when done
4. Dashboard shows unpurchased items

### Logging Health Metrics
1. Click "Health" tab
2. Select metric type
3. Enter date, value, unit
4. Auto-saves to Health Logs sheet
5. Track trends over time

## Meta Fields
Additional tracking in Meta sheet:
- `bkid` - Next book ID counter (auto-incremented)
- `booksGoal` - Your yearly reading goal
- `gid` - Next grocery ID counter (auto-incremented)
- `hid` - Next health log ID counter (auto-incremented)

## Troubleshooting

**Data not saving?**
- Check browser console for errors
- Verify Apps Script deployment is active
- Run `scanMissingData()` to find incomplete entries

**Missing sheets?**
- Run `setupSheets()` again
- It will create/reset all sheets with proper headers

**Formatting issues?**
- Sheets auto-resize columns
- Use the Meta sheet to view all meta values

## Future Enhancements

These sheets are now ready for:
- **Telegram automations** via Make.com (send daily health summary)
- **Analytics** (reading trends, grocery spending, health progress)
- **Data export** (to Convex or other backend)
- **Scheduled reports** (weekly grocery list reminder)

## API Endpoints

When deployed, your Apps Script provides:

**GET** - Fetch all data
```
GET /apps/script/macros/d/{DEPLOYMENT_ID}/usercallback
→ Returns complete D object with all sheets
```

**POST** - Save all data
```
POST /apps/script/macros/d/{DEPLOYMENT_ID}/usercallback
Body: { books: [...], groceries: [...], healthLogs: [...], ... }
→ Writes to all sheets, returns { success: true, savedAt: timestamp }
```

## Questions?

Check your Sheets for:
1. All data stored in respective sheets
2. Meta sheet for counters and goals
3. Use `scanMissingData()` to identify any issues
