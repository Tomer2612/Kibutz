# Withly Frontend
Next.js 15 frontend for the Withly community platform.

## Setup
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Pages
- `/` - Home (community discovery)
- `/login`, `/signup` - Authentication
- `/communities` - Browse communities
- `/communities/create` - Create new community
- `/communities/[id]` - Community dashboard
- `/communities/[id]/about` - Community info
- `/communities/[id]/members` - Member list
- `/communities/[id]/manage` - Admin settings
- `/communities/feed` - Community feed
- `/communities/events` - Events calendar
- `/profile/[userId]` - User profile
- `/settings` - User settings
- `/pricing` - Subscription plans
- `/support` - Help & support

## Tech
- Next.js 15 (App Router)
- React 19
- Tailwind CSS
- react-datepicker
- jwt-decode
