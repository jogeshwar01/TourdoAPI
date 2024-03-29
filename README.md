<div align="right">
  <img src="https://img.shields.io/badge/Completion-100%25-blue.svg" />
</div>

<div>
  <h1>Tourdo 🚴</h1>
</div> 
Exploring destination options and ideas with no firm plans and  reserving a certain activity.

## Key Features

* Authentication and Authorization
  - Login and logout
* Tour
  - Manage booking, check tours map, check users' reviews and rating
* User profile
  - Update username, photo, email, and password
* Credit card Payment

# Postman

Setting environmental variable based on response.
Put it in Tests tab.

```text
pm.environment.set("jwt", pm.response.json().token);
```

# Security best practices

### Compromised database

- Strongly encrypt passwords with salt and hash (bcrypt)
- Strongly encrypt password reset tokens (SHA 256)

### Brute force attacks

- Use bcrypt (to make login requests slow)
- Implement rate limiting (express-rate-limit)
- Implement maximum login attempts

### Cross-site scripting (XSS) attacks

- Store JWT in HTTPOnly cookies
- Sanitize user input data
- Set special HTTP headers (helment package)

### Denial-of-service (DOS) attack

- Implement rate limiting (express-rate-limit)
- Limit body payload (in body-parser)
- Avoid evil regular expression

### Nosql query injection

- Use mongoose for MongoDB (because of SchemaTypes)
- Sanitize user input data

### Other

- Always use HTTPS
- Create random password reset tokens with expiry dates
- Deny access to JWT after password change
- Don't commit sensitive config data to Git
- Don't send error details to clients
- Prevent cross-site request forgery (csurf package)
- Require re-authentication before a high-value action
- Implement a blacklist of untrusted JWT
- Confirm user email address after first creating account
- Keep user logged in with refresh tokens
- Implement two-factor authentication
