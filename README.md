# Student Attendance Tracking System

A responsive student attendance portal built with HTML5, CSS3, and vanilla JavaScript. Student profiles, credentials, subjects, and attendance records are read from `data/students.json`.

The student portal starts at `index.html`. Use VS Code Live Server because browsers block the JSON fetch when these pages are opened directly as `file://` URLs.

## Project structure

```text
Student-Attendance-System/
├── index.html
├── admin.html
├── admin-students.html
├── admin-attendance.html
├── profile.html
├── subjects.html
├── subject.html
├── history.html
├── planner.html
├── css/
│   ├── style.css
│   ├── pages.css
│   └── theme.css
├── js/
│   ├── script.js
│   ├── secondary-pages.js
│   ├── student-pages.js
│   ├── admin-data.js
│   ├── admin.js
│   ├── admin-shell.js
│   ├── admin-students.js
│   └── admin-attendance.js
├── data/
│   └── students.json
├── assets/
│   ├── images/
│   └── icons/
└── README.md
```

## Run in VS Code

1. Open the `Student-Attendance-System` folder in Visual Studio Code.
2. Install the **Live Server** extension if needed.
3. Open `index.html` and choose **Go Live** in the status bar (or right-click and select **Open with Live Server**).

## Student login accounts

The following fictional demonstration accounts are included in `data/students.json`:

| Student | Login ID | Password |
| --- | --- | --- |
| Aarav Sharma | `student01` | `Campus@101` |
| Isha Patel | `student02` | `Campus@102` |
| Kabir Verma | `student03` | `Campus@103` |
| Ananya Singh | `student04` | `Campus@104` |
| Vihaan Rao | `student05` | `Campus@105` |
| Meera Nair | `student06` | `Campus@106` |
| Arjun Mehta | `student07` | `Campus@107` |
| Diya Iyer | `student08` | `Campus@108` |
| Reyansh Gupta | `student09` | `Campus@109` |
| Sana Khan | `student10` | `Campus@110` |
| Advik Joshi | `student11` | `Campus@111` |
| Kiara Das | `student12` | `Campus@112` |

## Admin pages

Select **Administrator login** from the student login page. Use admin ID `admin` and password `Admin@123`.

The admin console is split across three top-navigation pages:

- **Overview** — account, subject, and attendance totals, JSON export, and a reset control that clears browser-saved changes and reloads `data/students.json`.
- **Students** — add, update, search, and delete student accounts. Admins choose each student login ID and password when creating an account. Credentials can also be changed while editing a student.
- **Attendance** — add, edit, or delete one student's class records.

Admin access remains active between these pages for the current browser tab. Log out from the header to end the admin session. Changes are saved to local storage in that browser. A static browser page cannot overwrite `data/students.json`, so use **Export JSON** on Overview to download a replacement data file when you want to save the updated dataset as the project baseline.

## Attendance data

Edit `data/students.json` to change profiles, credentials, subjects, or attendance records. Each attendance entry contains a date, a subject ID from the `subjects` list, and a `present` or `absent` status. Student and subject percentages are calculated from those individual records.

All included names, credentials, and attendance data are fictional demonstration data. Admin and student passwords are visible in the front-end files and browser storage; use server-side authentication and a protected database before using real student information.

## Features

- Student login and responsive dashboard with overall and subject-wise attendance.
- Separate Subjects, History, and Planner pages available from the top navigation.
- Click any subject card to view its percentage, class totals, and dated attendance records.
- Attendance history filters and consecutive-class recovery calculator.
- Separate administrator overview, student directory, and attendance management pages.
- Clean high-contrast campus theme with restrained accents and horizontal navigation.






