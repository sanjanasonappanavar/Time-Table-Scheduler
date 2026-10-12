# Generate Timetable

The **Generate Timetable** button now creates a schedule from the data already entered in the app.

It uses:
- Working days and period duration from **Manage Time Settings**
- Start/end time, break and lunch times
- Each subject's **Weekly Hours Required**
- Teacher-subject assignments
- Available rooms
- Lab / lab-location requirements

The generator prevents:
- Two subjects for the same class at the same time
- A teacher being scheduled twice at the same time
- A room being used twice at the same time
- Lab sessions being split across rooms
- Classes being placed during break or lunch

## Run the updated project

### Backend
```powershell
cd backend
npm install
node server.js
```

### Frontend (open a second terminal)
```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Before generating
1. Add subjects and set **Weekly Hours Required**.
2. Add teachers.
3. Add rooms. For labs, add a room whose name contains `LAB` and use that exact room name as the subject's lab location.
4. Assign each subject to a teacher.
5. Configure working days, period duration, breaks and lunch.
6. Open **Manage Timetables** and click **Generate Timetable**.

If the requested weekly hours cannot fit into the available periods/rooms, the app reports which subjects could not be scheduled instead of silently generating an incomplete timetable.
