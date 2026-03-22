Calendar X – MVP Development Task
Overview
Calendar X is a calendar aggregation and sharing tool.
The goal of this task is to build a Minimum Viable Product (MVP) that allows a user to
connect multiple calendars, create custom calendar views, and share those views with
others through a link.
The focus is on core functionality and clean architecture, not a full production system.
Core Concept
A user should be able to:
1. Sign up or log in
2. Connect multiple calendars (Google and ODice 365)
3. Create custom calendar boards (views) using selected calendars
4. Control what event information is visible
5. Generate a shareable link for each board
6. Keep the shared view updated automatically as source calendars change
Anyone with the link should be able to open it and see the latest version of that calendar
view.
Required Features
1. Connect Multiple Calendars
The system must allow a user to connect:
• Multiple Google / Gmail calendars
• Multiple OJice 365 calendars
All connected calendars should be available inside the user’s Calendar X account.
2. Calendar Boards (Custom Views)
Users must be able to create calendar boards.
A calendar board is a custom view that includes selected calendars.
For each board, the user should be able to:

2

• Select which calendars to include
• Name the board
• Create multiple boards with diDerent configurations
Example board names:
• “ODice Calendar”
• “X Calendar”
• “Team View”
3. Event Visibility Options
Each board must support event masking.
Unmasked
Shows the real event title.
Example:
Client Meeting
Masked
Hides the event title and shows limited information.
Example:
Busy
or
X Calendar
4. Color Coding
Events or calendars should be color coded so users can easily identify which calendar
they come from.
Example:
• X calendar – blue
• Y calendar – green
• Z calendar – red
5. Date Visibility Controls

3

Each calendar board should allow the user to control what date range is visible.
This includes settings for:
• whether past events are visible
• how far into the future events are visible
• whether only the current week is visible
• whether two weeks ahead is visible
• whether a broader forward/backward range is available
Examples:
• Show only current week
• Show 2 weeks ahead
• Hide past events
• Show limited past events
This setting applies to the shared board link.
6. Shareable Calendar Link
Each calendar board must generate a shareable link.
Anyone with the link should be able to:
1. open the selected calendar board
2. reflect the board’s saved visibility rules
3. always show the latest updated version of the board
4. be bookmarkable by the recipient
5. remain tied to the original user’s connected calendars and board configuration
The viewer does not need access to the original calendars.
Example use case
A user creates a board called “John’s View”, includes 3 calendars, masks event titles, and
allows viewing 2 weeks ahead only.
They send the generated link to John.
Whenever John opens that link, he sees the latest version of that configured board.
Example User Flow

4

1. User signs up for Calendar X
2. User connects Google and ODice 365 calendars
3. User creates a board including selected calendars
4. User chooses whether events are masked or visible
5. User sets the date range visibility
6. Usernames the board
7. Calendar X generates a shareable link
Anyone opening that link sees the configured calendar view.
Functional Scope of the MVP
Required
The MVP must include:
• user authentication
• connection of multiple OJice 365 calendars
• connection of multiple Gmail / Google calendars
• retrieval of calendar events from connected accounts
• creation of multiple calendar boards
• calendar selection per board
• event masking option per board
• color coding of calendars/events
• board naming
• shareable board link generation
• automatic updated view when source calendars change
• date range controls for past/future visibility
The product should account for the following core entities:
User
The account owner using Calendar X.

5

Connected Calendar Account
A linked Google or Microsoft account.
Calendar
An individual calendar pulled from a connected account.
Event
A calendar event synced from one of the connected calendars.
Calendar Board
A saved custom view created by the user.
Shared Link
A public or private URL that opens a specific saved board.
Final Summary
Calendar X is a calendar-sharing platform where users can connect multiple ODice 365
and Gmail calendars, build custom filtered calendar boards, control what information is
visible, and generate shareable links that always display an up-to-date version of those
views.
The MVP should prove that a user can:
• connect multiple calendars
• create multiple custom views
• choose what to show or hide
• name each view
• share it through a stable link
• let others see a live, updated version of that calendar board