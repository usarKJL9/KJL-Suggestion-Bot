# ⭐ KJL-Suggestion-Bot

A modern Discord suggestion & feedback bot built with **discord.js v14**. It allows server members to submit suggestions and feedback through dedicated channels, with voting and admin status management.

## 🚀 Features

- **Suggestions Channel**: Users type their suggestion → bot deletes the message and posts an embed with upvote/downvote buttons.
- **Voting System**: Members can upvote or downvote each suggestion. Vote counts update in real time.
- **Admin Action Button**: Administrators or users with a configured role can change a suggestion's status (Approve, Reject, In Progress) via a select menu.
- **Feedback Channel**: Users submit feedback text → bot asks for a star rating (1-5) via a select menu → final embed is posted.
- **Visual Polish**: Embeds show author avatar, timestamps, and color-coded status.
- **No Prefix Commands**: Just configure channels and let users type naturally.
- **Persistent Voting Data**: Votes are stored in memory for the lifetime of the bot (per suggestion message).

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/KJL-Suggestion-Bot.git
   cd KJL-Suggestion-Bot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure the bot**:
   Create a `config.js` file in the root directory with the following structure:
   ```javascript
   module.exports = {
       TOKEN: "YOUR_BOT_TOKEN",
       Suggestions_CHANNEL_ID: "CHANNEL_ID_FOR_SUGGESTIONS",
       Feedback_CHANNEL_ID: "CHANNEL_ID_FOR_FEEDBACK",
       Admin_ROLE_ID: "OPTIONAL_ADMIN_ROLE_ID", // leave empty string if you want only server admins
   };
   ```

4. **Start the bot**:
   ```bash
   node index.js
   ```

## 📜 How to Use

| Action | Description |
| --- | --- |
| **Submit a suggestion** | Type any message in the configured suggestions channel → the bot will delete it and create an embed with voting buttons. |
| **Vote** | Click ⬆️ or ⬇️ on any suggestion embed. Click again to remove your vote. |
| **Change status (Admin only)** | Click the ⚙️ Action button → choose a new status from the dropdown. |
| **Submit feedback** | Type any message in the configured feedback channel → the bot will ask you to pick a star rating. |

> **Admin permission**: Users with `Administrator` permission OR the role ID set in `Admin_ROLE_ID` can change suggestion statuses.

## 👤 Credits

Developed by **KJL**.

## 📝 ملاحظة (Note)

هذا المشروع مفتوح المصدر ويحق لك التعديل عليه بما لا يخالف قوانين الديسكورد الرسمية.  
(This project is open‑source, and you have the right to modify it in a way that does not violate official Discord rules.)

## 📄 License

This project is licensed under the MIT License.
