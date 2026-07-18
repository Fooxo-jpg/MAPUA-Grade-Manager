<div align="center">

# 📘 Gradebook

**A warm, ledger-styled desktop gradebook for tracking courses, terms, schedules, assessments, and GWA — built for students who like their tools tidy.**

![Version](https://img.shields.io/badge/version-1.0.0-2D5240?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-B8860B?style=flat-square)
![Built with](https://img.shields.io/badge/built%20with-React%20%2B%20Electron-3B5BA9?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-7A4FA3?style=flat-square)

</div>

---

## ✨ What is this?

Gradebook is an all-in-one academic tracker: enroll courses into terms, log assessments as you go, watch your GWA update automatically, and see exactly what grade you need to hit your goal — all in a single offline desktop app that keeps your data on your own machine.

## 📸 Preview
<img width="1359" height="690" alt="image" src="https://github.com/user-attachments/assets/d1810cd2-0c3d-40fc-bae2-7d91a4020aa7" />

## 🗂️ Features

### 🏠 Dashboard
- **Today's Schedule** at a glance, with live "up next" highlighting
- **Progress to Graduation** — total units required, passed, and remaining
- **This Term at a Glance** — units considered, the grade you need this term to stay on your goal GWA, and your overall cumulative GWA
- **GWA History** chart across every finished term

### 📚 Course Catalog
- Track code, name, units, instructor, color, type (Core / Elective / Specialization / etc.), and prerequisites/co-requisites
- **Units Considered** toggle — exclude a course's units from GWA math entirely, independent of what grade it gets
- **Category Weights** — turn on weighted grading categories (Quizzes, Exams, Projects...) per course, with weights that stay live-linked to every assessment logged under them
- Automatic **Taken / In Current Load / Not Yet Taken** status per course, based on its assigned term

### 🗓️ Manage Term
- Group courses into terms with a unit-load cap
- Automatic warnings when adding a course would exceed your term's unit limit

### 📝 Manage Grades
- Log assessments (score / total / weight or category) per course and watch the possible grade compute live
- Final grades are picked from a fixed, typo-proof grade scale — no more stray free-text entries
- Grade logging is locked until a term actually starts, and turns read-only once it ends

### 📆 Schedule Maker
- Weekly calendar view with custom per-block colors, multiple meeting times per course, and online/in-person room support
- Conflict-aware time editing with inline validation

### ⚙️ Account Settings
- Student profile, grading system (1.00 or 5.00 as the top grade), grade-conversion table, goal GWA, and required units — all in one place

### 💾 Data Manager
- Export/import your entire dataset as JSON for backup or transfer between devices

### 🖥️ Desktop App
- Packaged with **Electron** for Windows, macOS, and Linux
- **Auto-updates** — checks for new releases on launch and installs them seamlessly

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| UI | React 19 + Vite |
| Charts | Recharts |
| Icons | Lucide |
| Desktop shell | Electron |
| Packaging | electron-builder |
| Updates | electron-updater (via GitHub Releases) |
| Storage | Browser `localStorage` (fully offline, no account/server needed) |

## 📁 Project Structure
```
gradeManager/
├── electron/           # Electron main process + preload
├── src/
│   ├── components/     # Dashboard, ManageCourses, ManageGrades, ManageTerm,
│   │                    # ManageSchedule, AccountSettings, DataManager, Sidebar
│   ├── utils.js         # Grade math, GWA calculations, shared helpers
│   ├── App.jsx          # Root layout + state management
│   └── App.css
├── build/               # App icons (icon.png / .ico / .icns)
└── package.json
```

## 🔒 Privacy

Everything is stored locally in your browser/app via `localStorage` — no accounts, no servers, no data leaving your device. Use the Data Manager to back up or move your data yourself.

## 📄 License

MIT — do whatever you'd like with it.

---

<div align="center">
<sub>Built with 🍃 for students who'd rather track grades than guess them.</sub>
</div>
