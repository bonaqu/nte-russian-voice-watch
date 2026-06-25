# Security

The public site is static and has no user accounts, forms, analytics or server-side database. The scheduled checker performs GET requests only and limits document size, redirects, retries and timeouts.

Do not place tokens in source files. Optional Telegram credentials belong only in GitHub repository secrets:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Report security issues privately to the repository owner rather than publishing working exploit details in a public issue.
