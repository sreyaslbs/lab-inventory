# Laboratory Inventory Management System

A comprehensive web application for managing laboratory inventory across multiple science subjects with role-based access control, stock tracking, breakage recording, and report generation.

## Features

### 🔬 Multi-Subject Support
- General Science
- Biology
- Physics
- Chemistry

### 👥 Role-Based Access Control
1. **Admin/Teacher** - Full access to all features
2. **Lab In-Charge** - Update stock and record breakages for assigned subjects
3. **Guest** - View-only access to current stock

### 📦 Inventory Management
- Add new items with details (Item #, Particulars, Quantity, Price, Remarks)
- Edit existing items
- Delete items
- Low stock alerts
- Stock status indicators (Normal, Low, Out of Stock)

### 📊 Stock Operations
- Add new stock
- Record breakages/spoilage
- Complete transaction history
- Audit trail with user information

### 📈 Reporting
- Current Stock Report
- Low Stock Alert Report
- Transaction History Report
- Filter by subject and date range
- Export to Excel
- Print-friendly views

### 🔍 Search & Filter
- Search by item number or name
- Filter by stock status (All, Low Stock, Out of Stock)
- Real-time search results

## Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable **Realtime Database**
   - Go to Build → Realtime Database
   - Click "Create Database"
   - Choose location and start in **test mode** (we'll add security rules later)

4. Enable **Authentication**
   - Go to Build → Authentication
   - Click "Get Started"
   - Enable "Google" sign-in method
   - Add your domain to authorized domains

5. Get your Firebase configuration:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web icon (</>)
   - Copy the configuration object

6. Update `firebase-config.js`:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

### 2. Configure Admin Users

Edit `app.js` and update the admin emails list (line 105-108):

```javascript
admins: [
    'your-email@gmail.com',
    'another-admin@gmail.com'
]
```

### 3. Deploy

#### Option A: Local Testing
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server . -p 8000
```

Then open `http://localhost:8000` in your browser.

#### Option B: Deploy to Netlify
1. Create account at [Netlify](https://netlify.com)
2. Drag and drop the `lab-inventory` folder
3. Add your Netlify domain to Firebase authorized domains

#### Option C: Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### 4. Add School Logo (Optional)

Replace `emblem.png` with your school's logo (recommended size: 192x192px or 512x512px).

## Usage Guide

### For Admins/Teachers

1. **Sign in** with Google account
2. **Add Teachers**: Go to Settings → Add admin users
3. **Assign Lab In-Charges**: Go to Settings → Manage lab in-charges for each subject
4. **Add Items**: 
   - Navigate to subject tab
   - Click "+ Add Item"
   - Fill in details (Item #, Particulars, Quantity, Price, Min Stock Level, Remarks)
5. **Update Stock**: Click 📦 icon on any item
6. **Generate Reports**: Go to Reports tab, select options, click "Generate Report"

### For Lab In-Charges

1. **Sign in** with assigned Google account
2. **Update Stock**: Navigate to assigned subject, click 📦 on items
3. **Record Breakages**: Select "Record Breakage/Spoilage" in stock modal
4. **View Reports**: Generate reports for assigned subjects

### For Guests

1. **Sign in** with Google account
2. **View Inventory**: Browse all subjects to see current stock levels
3. **Search Items**: Use search bar to find specific items

## Data Structure

```
lab_inventory/
├── teachers/              # Admin users
├── lab_incharges/         # Lab assistants by subject
│   ├── general_science/
│   ├── biology/
│   ├── physics/
│   └── chemistry/
├── inventory/             # Items by subject
│   ├── general_science/
│   ├── biology/
│   ├── physics/
│   └── chemistry/
└── transactions/          # Transaction history
    ├── general_science/
    ├── biology/
    ├── physics/
    └── chemistry/
```

## Firebase Security Rules

Add these rules to your Realtime Database:

```json
{
  "rules": {
    "lab_inventory": {
      ".read": "auth != null",
      "teachers": {
        ".write": "auth != null"
      },
      "inventory": {
        "$subject": {
          ".write": "auth != null"
        }
      },
      "lab_incharges": {
        ".write": "auth != null"
      },
      "transactions": {
        "$subject": {
          ".write": "auth != null"
        }
      }
    }
  }
}
```

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## PWA Support

The app can be installed on mobile devices:
1. Open the app in mobile browser
2. Tap "Add to Home Screen"
3. Use like a native app

## Troubleshooting

### Login Issues
- Ensure your domain is added to Firebase authorized domains
- Check browser console for errors
- Verify Firebase configuration

### Data Not Saving
- Check Firebase Realtime Database rules
- Ensure you're signed in
- Check browser console for errors

### Reports Not Generating
- Ensure you have items in inventory
- Check if SheetJS library is loaded (for Excel export)

## Support

For issues or questions, check the browser console for error messages.

## License

This project is created for educational purposes.
